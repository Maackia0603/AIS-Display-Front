import React, { useState, useCallback, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { ScatterplotLayer, PathLayer, PolygonLayer, GeoJsonLayer } from '@deck.gl/layers';
import CoordinateInput from '../components/CoordinateInput';
import '../style/GeoJsonDisplay.css';

const initialViewState = {
  longitude: -74, // 经度
  latitude: 40.72, // 纬度
  zoom: 13, // 缩放大小
  pitch: 0, // 地图倾斜角度 - 设置为0度平视
  bearing: 0, // 地图旋转角度
  minZoom: 1, // 最小缩放级别
  maxZoom: 20 // 最大缩放级别
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

export default function GeoJsonDisplay() {
  const [viewState, setViewState] = useState(initialViewState);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [pulseRadius, setPulseRadius] = useState(8);
  
  // 可交互矩形状态
  const [interactiveRect, setInteractiveRect] = useState(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [interactionType, setInteractionType] = useState(null); // 'move', 'resize', 'rotate'
  const [initialMousePos, setInitialMousePos] = useState(null);
  const [initialRectState, setInitialRectState] = useState(null);
  const [rectName, setRectName] = useState('');
  const [apiGeoJsonData, setApiGeoJsonData] = useState(null);

  // 计算矩形的四个角点
  const calculateRectCorners = useCallback((centerLng, centerLat, width, height, angle) => {
    // 将经纬度单位转换为米进行计算
    const widthMeters = width * 111320 * Math.cos(centerLat * Math.PI / 180);
    const heightMeters = height * 111320;
    
    const halfWidthMeters = widthMeters / 2;
    const halfHeightMeters = heightMeters / 2;
    
    // 在米坐标系中计算四个角点
    const cornersMeters = [
      [-halfWidthMeters, -halfHeightMeters], // 左上
      [halfWidthMeters, -halfHeightMeters],  // 右上
      [halfWidthMeters, halfHeightMeters],   // 右下
      [-halfWidthMeters, halfHeightMeters]   // 左下
    ];
    
    // 应用旋转（在米坐标系中）
    const cos = Math.cos(angle * Math.PI / 180);
    const sin = Math.sin(angle * Math.PI / 180);
    
    // 将旋转后的米坐标转换回经纬度
    return cornersMeters.map(([x, y]) => {
      // 应用旋转矩阵
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      
      // 转换回经纬度
      const lng = centerLng + rotatedX / (111320 * Math.cos(centerLat * Math.PI / 180));
      const lat = centerLat + rotatedY / 111320;
      
      return { lng, lat };
    });
  }, []);

  // 处理坐标输入并定位到地图
  const handleCoordinateSubmit = useCallback((coordinate) => {
    // 创建可交互矩形（以定位点为中心）
    // 500000米转换为经纬度单位（大约4.5度）
    const rectSize = 500000 / 111320; // 500000米转换为经纬度单位
    
    // 计算矩形边界
    const halfWidth = rectSize / 2;
    const halfHeight = rectSize / 2;
    const bounds = {
      north: coordinate.latitude + halfHeight,
      south: coordinate.latitude - halfHeight,
      east: coordinate.longitude + halfWidth,
      west: coordinate.longitude - halfWidth
    };
    
    // 计算适合的缩放级别以显示整个矩形
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    // 根据矩形大小计算合适的缩放级别
    let zoom = 15;
    if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 14;
    
    setViewState({
      ...viewState,
      longitude: coordinate.longitude,
      latitude: coordinate.latitude,
      zoom: zoom
    });
    
    // 设置标记点位置
    setMarkerPosition({
      longitude: coordinate.longitude,
      latitude: coordinate.latitude
    });
    
    // 重置脉冲动画
    setPulseRadius(8);
    
    setInteractiveRect({
      center: {
        longitude: coordinate.longitude,
        latitude: coordinate.latitude
      },
      width: rectSize,
      height: rectSize,
      angle: 0, // 初始角度为0
      corners: calculateRectCorners(coordinate.longitude, coordinate.latitude, rectSize, rectSize, 0)
    });
  }, [viewState, calculateRectCorners]);

  // 脉冲动画效果
  useEffect(() => {
    if (!markerPosition) return;

    const interval = setInterval(() => {
      setPulseRadius(prev => prev === 8 ? 12 : 8);
    }, 1000);

    return () => clearInterval(interval);
  }, [markerPosition]);

  // 将屏幕坐标转换为地理坐标
  const screenToLngLat = useCallback((screenX, screenY) => {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return null;
    
    const rect = mapContainer.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const { longitude, latitude, zoom } = viewState;
    
    // 计算相对于地图中心的偏移
    const centerX = width / 2;
    const centerY = height / 2;
    
    const offsetX = screenX - centerX;
    const offsetY = screenY - centerY;
    
    // 根据缩放级别计算经纬度偏移
    const scale = Math.pow(2, zoom);
    const lngOffset = (offsetX / width) * 360 / scale;
    const latOffset = (offsetY / height) * 180 / scale;
    
    return {
      lng: longitude + lngOffset,
      lat: latitude - latOffset
    };
  }, [viewState]);

  // 计算矩形的控制点（角点、边中点、旋转点）
  const calculateControlPoints = useCallback((rect) => {
    if (!rect) return [];
    
    const { center, width, height, corners } = rect;
    const controlPoints = [];
    
    // 角点
    corners.forEach((corner, index) => {
      controlPoints.push({
        type: 'corner',
        index,
        position: corner,
        lng: corner.lng,
        lat: corner.lat
      });
    });
    
    // 边中点
    const edgeMidpoints = [
      { lng: (corners[0].lng + corners[1].lng) / 2, lat: (corners[0].lat + corners[1].lat) / 2 }, // 上边
      { lng: (corners[1].lng + corners[2].lng) / 2, lat: (corners[1].lat + corners[2].lat) / 2 }, // 右边
      { lng: (corners[2].lng + corners[3].lng) / 2, lat: (corners[2].lat + corners[3].lat) / 2 }, // 下边
      { lng: (corners[3].lng + corners[0].lng) / 2, lat: (corners[3].lat + corners[0].lat) / 2 }  // 左边
    ];
    
    edgeMidpoints.forEach((point, index) => {
      controlPoints.push({
        type: 'edge',
        index,
        position: point,
        lng: point.lng,
        lat: point.lat
      });
    });
    
    // 旋转点（在矩形上方）
    const rotationDistance = Math.max(width, height) * 0.8;
    const rotationPoint = {
      lng: center.longitude,
      lat: center.latitude + rotationDistance
    };
    
    controlPoints.push({
      type: 'rotation',
      index: -1,
      position: rotationPoint,
      lng: rotationPoint.lng,
      lat: rotationPoint.lat
    });
    
    return controlPoints;
  }, []);

  // 检测点击位置是否在控制点附近
  const getControlPointAt = useCallback((lng, lat, controlPoints) => {
    // 根据地图缩放级别动态调整检测阈值
    const zoomFactor = Math.pow(2, viewState.zoom);
    const threshold = 0.1 / zoomFactor; // 缩放级别越高，阈值越小
    
    
    for (const point of controlPoints) {
      const distance = Math.sqrt(
        Math.pow(point.lng - lng, 2) + Math.pow(point.lat - lat, 2)
      );
      if (distance < threshold) {
        return point;
      }
    }
    return null;
  }, [viewState.zoom]);

  // 检查点是否在矩形内
  const isPointInRect = useCallback((point, rect) => {
    // 使用射线法判断点是否在多边形内
    const { corners } = rect;
    let inside = false;
    
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
      if (((corners[i].lat > point.lat) !== (corners[j].lat > point.lat)) &&
          (point.lng < (corners[j].lng - corners[i].lng) * (point.lat - corners[i].lat) / (corners[j].lat - corners[i].lat) + corners[i].lng)) {
        inside = !inside;
      }
    }
    return inside;
  }, []);

  // 处理原生鼠标事件
  const handleNativeMouseDown = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const coords = screenToLngLat(x, y);
    if (!coords) return;
    
    const point = { lng: coords.lng, lat: coords.lat };
    
    // 如果存在可交互矩形，检查是否点击了控制点
    if (interactiveRect) {
      const controlPoints = calculateControlPoints(interactiveRect);
      const clickedControlPoint = getControlPointAt(point.lng, point.lat, controlPoints);
      
      if (clickedControlPoint) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsInteracting(true);
        setInitialMousePos(point);
        setInitialRectState({ ...interactiveRect });
        
        if (clickedControlPoint.type === 'corner') {
          setInteractionType('resize');
        } else if (clickedControlPoint.type === 'edge') {
          setInteractionType('resize');
        } else if (clickedControlPoint.type === 'rotation') {
          setInteractionType('rotate');
        }
        return false; // 确保事件不会继续传播
      }
      
      // 检查是否点击了矩形内部（移动整个矩形）
      if (isPointInRect(point, interactiveRect)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsInteracting(true);
        setInteractionType('move');
        setInitialMousePos(point);
        setInitialRectState({ ...interactiveRect });
        return false; // 确保事件不会继续传播
      }
    }
  }, [interactiveRect, calculateControlPoints, getControlPointAt, isPointInRect, screenToLngLat]);

  const handleNativeMouseMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const coords = screenToLngLat(x, y);
    if (!coords) return;
    
    const point = { lng: coords.lng, lat: coords.lat };
    
    // 处理可交互矩形的操作
    if (isInteracting && interactiveRect && initialMousePos && initialRectState) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const deltaLng = point.lng - initialMousePos.lng;
      const deltaLat = point.lat - initialMousePos.lat;
      
      if (interactionType === 'move') {
        // 移动整个矩形
        const newCenter = {
          longitude: initialRectState.center.longitude + deltaLng,
          latitude: initialRectState.center.latitude + deltaLat
        };
        
        const newCorners = calculateRectCorners(
          newCenter.longitude,
          newCenter.latitude,
          initialRectState.width,
          initialRectState.height,
          initialRectState.angle
        );
        
        setInteractiveRect({
          ...initialRectState,
          center: newCenter,
          corners: newCorners
        });
      } else if (interactionType === 'resize') {
        // 调整矩形大小 - 支持长方形调整
        const center = initialRectState.center;
        const currentPoint = { lng: point.lng, lat: point.lat };
        
        // 将当前点转换到矩形的局部坐标系
        const cos = Math.cos(-initialRectState.angle * Math.PI / 180);
        const sin = Math.sin(-initialRectState.angle * Math.PI / 180);
        
        const relativeX = (currentPoint.lng - center.longitude) * cos - (currentPoint.lat - center.latitude) * sin;
        const relativeY = (currentPoint.lng - center.longitude) * sin + (currentPoint.lat - center.latitude) * cos;
        
        // 计算初始点的相对坐标
        const initialRelativeX = (initialMousePos.lng - center.longitude) * cos - (initialMousePos.lat - center.latitude) * sin;
        const initialRelativeY = (initialMousePos.lng - center.longitude) * sin + (initialMousePos.lat - center.latitude) * cos;
        
        // 根据拖拽的角点索引计算新的宽度和高度
        let newWidth = initialRectState.width;
        let newHeight = initialRectState.height;
        
        // 获取拖拽的控制点信息
        const controlPoints = calculateControlPoints(initialRectState);
        const zoomFactor = Math.pow(2, viewState.zoom);
        const detectionThreshold = 0.1 / zoomFactor; // 根据缩放级别调整检测阈值
        
        const draggedPoint = controlPoints.find(p => {
          const distance = Math.sqrt(
            Math.pow(p.lng - initialMousePos.lng, 2) + 
            Math.pow(p.lat - initialMousePos.lat, 2)
          );
          return distance < detectionThreshold;
        });
        
        if (draggedPoint) {
          if (draggedPoint.type === 'corner') {
            // 角点拖拽 - 同时调整宽度和高度
            const widthScale = Math.abs(relativeX) / Math.abs(initialRelativeX);
            const heightScale = Math.abs(relativeY) / Math.abs(initialRelativeY);
            
            newWidth = Math.max(0.001, initialRectState.width * widthScale);
            newHeight = Math.max(0.001, initialRectState.height * heightScale);
          } else if (draggedPoint.type === 'edge') {
            // 边中点拖拽 - 只调整对应的边
            if (draggedPoint.index === 0 || draggedPoint.index === 2) { // 上边或下边
              const heightScale = Math.abs(relativeY) / Math.abs(initialRelativeY);
              newHeight = Math.max(0.001, initialRectState.height * heightScale);
            } else if (draggedPoint.index === 1 || draggedPoint.index === 3) { // 左边或右边
              const widthScale = Math.abs(relativeX) / Math.abs(initialRelativeX);
              newWidth = Math.max(0.001, initialRectState.width * widthScale);
            }
          }
        } else {
          // 备用方案 - 使用距离缩放
          const distanceFromCenter = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
          const initialDistance = Math.sqrt(initialRelativeX * initialRelativeX + initialRelativeY * initialRelativeY);
          const scale = initialDistance > 0 ? Math.max(0.1, distanceFromCenter / initialDistance) : 1;
          
          newWidth = Math.max(0.001, initialRectState.width * scale);
          newHeight = Math.max(0.001, initialRectState.height * scale);
        }
        
        const newCorners = calculateRectCorners(
          center.longitude,
          center.latitude,
          newWidth,
          newHeight,
          initialRectState.angle
        );
        
        setInteractiveRect({
          ...initialRectState,
          width: newWidth,
          height: newHeight,
          corners: newCorners
        });
      } else if (interactionType === 'rotate') {
        // 旋转矩形 - 保持长方形形状
        const center = initialRectState.center;
        
        // 计算从中心到当前点的角度
        const currentAngle = Math.atan2(
          point.lat - center.latitude,
          point.lng - center.longitude
        ) * 180 / Math.PI;
        
        // 计算从中心到初始点的角度
        const initialAngle = Math.atan2(
          initialMousePos.lat - center.latitude,
          initialMousePos.lng - center.longitude
        ) * 180 / Math.PI;
        
        // 计算角度差
        const angleDelta = currentAngle - initialAngle;
        
        // 应用角度差到初始角度
        const newAngle = initialRectState.angle + angleDelta;
        
        // 重新计算矩形的四个角点，确保保持长方形形状
        const newCorners = calculateRectCorners(
          center.longitude,
          center.latitude,
          initialRectState.width,
          initialRectState.height,
          newAngle
        );
        
        setInteractiveRect({
          ...initialRectState,
          angle: newAngle,
          corners: newCorners
        });
      }
    }
  }, [isInteracting, interactiveRect, initialMousePos, initialRectState, interactionType, calculateRectCorners, calculateControlPoints, screenToLngLat, viewState.zoom]);


  const handleNativeMouseUp = useCallback((event) => {
    // 结束可交互矩形的操作
    if (isInteracting) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setIsInteracting(false);
      setInteractionType(null);
      setInitialMousePos(null);
      setInitialRectState(null);
    }
  }, [isInteracting]);

  // 添加原生鼠标事件监听器
  useEffect(() => {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;

    const handleMouseDown = (e) => {
      handleNativeMouseDown(e);
    };
    const handleMouseMove = (e) => handleNativeMouseMove(e);
    const handleMouseUp = (e) => handleNativeMouseUp(e);

    // 使用 capture: true 确保我们的处理器先执行
    mapContainer.addEventListener('mousedown', handleMouseDown, { capture: true });
    mapContainer.addEventListener('mousemove', handleMouseMove, { capture: true });
    mapContainer.addEventListener('mouseup', handleMouseUp, { capture: true });

    return () => {
      mapContainer.removeEventListener('mousedown', handleMouseDown, { capture: true });
      mapContainer.removeEventListener('mousemove', handleMouseMove, { capture: true });
      mapContainer.removeEventListener('mouseup', handleMouseUp, { capture: true });
    };
  }, [handleNativeMouseDown, handleNativeMouseMove, handleNativeMouseUp]);

  // 添加键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!interactiveRect) return;
      
      const step = 10000 / 111320; // 移动步长（10000米转换为经纬度单位）
      const angleStep = 5; // 角度步长
      const sizeStep = 10000 / 111320; // 大小步长（10000米转换为经纬度单位）
      
      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          // 向上移动
          const newCenterUp = {
            longitude: interactiveRect.center.longitude,
            latitude: interactiveRect.center.latitude + step
          };
          const newCornersUp = calculateRectCorners(
            newCenterUp.longitude,
            newCenterUp.latitude,
            interactiveRect.width,
            interactiveRect.height,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            center: newCenterUp,
            corners: newCornersUp
          });
          break;
        }
          
        case 'ArrowDown': {
          e.preventDefault();
          // 向下移动
          const newCenterDown = {
            longitude: interactiveRect.center.longitude,
            latitude: interactiveRect.center.latitude - step
          };
          const newCornersDown = calculateRectCorners(
            newCenterDown.longitude,
            newCenterDown.latitude,
            interactiveRect.width,
            interactiveRect.height,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            center: newCenterDown,
            corners: newCornersDown
          });
          break;
        }
          
        case 'ArrowLeft': {
          e.preventDefault();
          // 向左移动
          const newCenterLeft = {
            longitude: interactiveRect.center.longitude - step,
            latitude: interactiveRect.center.latitude
          };
          const newCornersLeft = calculateRectCorners(
            newCenterLeft.longitude,
            newCenterLeft.latitude,
            interactiveRect.width,
            interactiveRect.height,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            center: newCenterLeft,
            corners: newCornersLeft
          });
          break;
        }
          
        case 'ArrowRight': {
          e.preventDefault();
          // 向右移动
          const newCenterRight = {
            longitude: interactiveRect.center.longitude + step,
            latitude: interactiveRect.center.latitude
          };
          const newCornersRight = calculateRectCorners(
            newCenterRight.longitude,
            newCenterRight.latitude,
            interactiveRect.width,
            interactiveRect.height,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            center: newCenterRight,
            corners: newCornersRight
          });
          break;
        }
          
        case 'r':
        case 'R': {
          e.preventDefault();
          // 旋转矩形
          const newAngle = interactiveRect.angle + angleStep;
          const newCornersRotate = calculateRectCorners(
            interactiveRect.center.longitude,
            interactiveRect.center.latitude,
            interactiveRect.width,
            interactiveRect.height,
            newAngle
          );
          setInteractiveRect({
            ...interactiveRect,
            angle: newAngle,
            corners: newCornersRotate
          });
          break;
        }
          
        case '+':
        case '=': {
          e.preventDefault();
          // 放大矩形
          const newWidthPlus = interactiveRect.width + sizeStep;
          const newHeightPlus = interactiveRect.height + sizeStep;
          const newCornersPlus = calculateRectCorners(
            interactiveRect.center.longitude,
            interactiveRect.center.latitude,
            newWidthPlus,
            newHeightPlus,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            width: newWidthPlus,
            height: newHeightPlus,
            corners: newCornersPlus
          });
          break;
        }
          
        case '-': {
          e.preventDefault();
          // 缩小矩形
          const newWidthMinus = Math.max(0.001, interactiveRect.width - sizeStep);
          const newHeightMinus = Math.max(0.001, interactiveRect.height - sizeStep);
          const newCornersMinus = calculateRectCorners(
            interactiveRect.center.longitude,
            interactiveRect.center.latitude,
            newWidthMinus,
            newHeightMinus,
            interactiveRect.angle
          );
          setInteractiveRect({
            ...interactiveRect,
            width: newWidthMinus,
            height: newHeightMinus,
            corners: newCornersMinus
          });
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [interactiveRect, calculateRectCorners]);

  // 清除标记点
  const handleClearMarker = useCallback(() => {
    setMarkerPosition(null);
    setPulseRadius(8);
    setInteractiveRect(null);
    setRectName('');
  }, []);

  // 清除接口返回的GeoJSON数据
  const handleClearApiGeoJson = useCallback(() => {
    setApiGeoJsonData(null);
  }, []);

  // 发送矩形数据到接口
  const sendRectData = useCallback(async () => {
    if (!interactiveRect || !rectName.trim()) {
      alert('请输入矩形名称');
      return;
    }

    try {
      // 计算矩形的实际米数
      const widthMeters = interactiveRect.width * 111320 * Math.cos(interactiveRect.center.latitude * Math.PI / 180);
      const heightMeters = interactiveRect.height * 111320;

      const data = {
        name: rectName.trim(),
        x: parseFloat(interactiveRect.center.longitude.toFixed(6)),
        y: parseFloat(interactiveRect.center.latitude.toFixed(6)),
        rect_length: parseFloat(widthMeters.toFixed(1)),
        rect_width: parseFloat(heightMeters.toFixed(1)),
        rotation: parseFloat(interactiveRect.angle.toFixed(1))
      };


      const response = await fetch('http://127.0.0.1:9001/straitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        
        // 检查返回的数据是否包含GeoJSON
        if (result.geoJson || result.geojson || result.geometry) {
          // 处理不同可能的GeoJSON格式
          let geoJsonData = null;
          if (result.geoJson) {
            geoJsonData = result.geoJson;
          } else if (result.geojson) {
            geoJsonData = result.geojson;
          } else if (result.geometry) {
            geoJsonData = result;
          } else if (result.type === 'Feature' || result.type === 'FeatureCollection') {
            geoJsonData = result;
          }
          
          if (geoJsonData) {
            setApiGeoJsonData(geoJsonData);
            alert('数据发送成功！GeoJSON数据已加载到地图上。');
          } else {
            alert('数据发送成功！但未检测到有效的GeoJSON数据。');
          }
        } else {
          alert('数据发送成功！');
        }
      } else {
        console.error('接口返回错误:', response.status, response.statusText);
        alert('数据发送失败，请检查接口状态');
      }
    } catch (error) {
      console.error('发送数据时出错:', error);
      alert('发送数据时出错: ' + error.message);
    }
  }, [interactiveRect, rectName]);

  // 存储矩形数据到接口
  const storeRectData = useCallback(async () => {
    if (!interactiveRect || !rectName.trim()) {
      alert('请输入矩形名称');
      return;
    }

    try {
      // 计算矩形的实际米数
      const widthMeters = interactiveRect.width * 111320 * Math.cos(interactiveRect.center.latitude * Math.PI / 180);
      const heightMeters = interactiveRect.height * 111320;

      const data = {
        name: rectName.trim(),
        x: parseFloat(interactiveRect.center.longitude.toFixed(6)),
        y: parseFloat(interactiveRect.center.latitude.toFixed(6)),
        rect_length: parseFloat(widthMeters.toFixed(1)),
        rect_width: parseFloat(heightMeters.toFixed(1)),
        rotation: parseFloat(interactiveRect.angle.toFixed(1))
      };


      const response = await fetch('http://127.0.0.1:9001/storeStraitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();

        // 检查返回的数据是否包含GeoJSON
        if (result.geoJson || result.geojson || result.geometry) {
          // 处理不同可能的GeoJSON格式
          let geoJsonData = null;
          if (result.geoJson) {
            geoJsonData = result.geoJson;
          } else if (result.geojson) {
            geoJsonData = result.geojson;
          } else if (result.geometry) {
            geoJsonData = result;
          } else if (result.type === 'Feature' || result.type === 'FeatureCollection') {
            geoJsonData = result;
          }

          if (geoJsonData) {
            setApiGeoJsonData(geoJsonData);
            alert('数据存储成功！GeoJSON数据已加载到地图上。');
          } else {
            alert('数据存储成功！但未检测到有效的GeoJSON数据。');
          }
        } else {
          alert('数据存储成功！');
        }
      } else {
        console.error('存储接口返回错误:', response.status, response.statusText);
        alert('数据存储失败，请检查接口状态');
      }
    } catch (error) {
      console.error('存储数据时出错:', error);
      alert('存储数据时出错: ' + error.message);
    }
  }, [interactiveRect, rectName]);

  // 创建标记点数据（包含内层和外层）
  const markerData = markerPosition ? [
    // 外层脉冲环
    {
      position: [markerPosition.longitude, markerPosition.latitude],
      radius: pulseRadius * 1.5,
      color: [255, 0, 0, 80] // 更透明的红色
    },
    // 内层实心点
    {
      position: [markerPosition.longitude, markerPosition.latitude],
      radius: pulseRadius * 0.6,
      color: [255, 0, 0, 255] // 不透明的红色
    }
  ] : [];


  // 创建可交互矩形数据 - 用于EditableGeoJsonLayer
  const getInteractiveRectGeoJson = () => {
    if (!interactiveRect) return null;
    
    const { corners } = interactiveRect;
    
    return {
      type: 'Feature',
      properties: {
        id: 'interactive-rect',
        name: 'Interactive Rectangle'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [corners[0].lng, corners[0].lat],
          [corners[1].lng, corners[1].lat],
          [corners[2].lng, corners[2].lat],
          [corners[3].lng, corners[3].lat],
          [corners[0].lng, corners[0].lat]
        ]]
      }
    };
  };

  // 创建控制点数据 - 用于传统图层
  const getControlPointsData = () => {
    if (!interactiveRect) return [];
    
    const controlPoints = calculateControlPoints(interactiveRect);
    
    // 根据地图缩放级别调整控制点大小
    const zoomFactor = Math.pow(2, viewState.zoom);
    const adaptiveRadius = 0.01 / zoomFactor; // 缩放级别越高，控制点相对越小
    
    return controlPoints.map(point => ({
        position: [point.lng, point.lat],
      radius: point.type === 'rotation' ? adaptiveRadius * 1.5 : adaptiveRadius,
      color: point.type === 'rotation' ? [255, 255, 0, 255] : [255, 0, 255, 255],
        type: point.type
    }));
  };

  const interactiveRectGeoJson = getInteractiveRectGeoJson();
  const controlPointsData = getControlPointsData();

  // 创建图层
  const layers = [
    // 标记点图层
    new ScatterplotLayer({
      id: 'marker-layer',
      data: markerData,
      getPosition: d => d.position,
      getRadius: d => d.radius,
      getFillColor: d => d.color,
      getLineColor: [255, 255, 255, 255], // 白色边框
      lineWidthMinPixels: 0.5,
      pickable: true,
      radiusMinPixels: 4,
      radiusMaxPixels: 30,
      radiusScale: 1,
      // 添加脉冲动画效果
      updateTriggers: {
        getRadius: [pulseRadius]
      }
    }),
    // 可交互矩形图层 - 使用PolygonLayer
    ...(interactiveRectGeoJson ? [
      new PolygonLayer({
      id: 'interactive-rect-layer',
        data: [interactiveRectGeoJson],
        pickable: true,
        getPolygon: d => d.geometry.coordinates,
        getLineColor: [0, 255, 255, 255], // 青色边框，完全不透明
        getFillColor: [0, 255, 255, 20], // 更透明的填充
        lineWidthMinPixels: 1,
        filled: true,
        stroked: true
      })
    ] : []),
    // 控制点图层 - 显示所有控制点
    new ScatterplotLayer({
      id: 'control-points-layer',
      data: controlPointsData,
      getPosition: d => d.position,
      getRadius: d => d.radius,
      getFillColor: d => d.color,
      getLineColor: [255, 255, 255, 255],
      lineWidthMinPixels: 1,
      pickable: true,
      radiusMinPixels: 8, // 自适应最小半径
      radiusMaxPixels: 20, // 自适应最大半径
      radiusScale: 1
    }),
    // 接口返回的GeoJSON图层
    ...(apiGeoJsonData ? [
      new GeoJsonLayer({
        id: 'api-geojson-layer',
        data: apiGeoJsonData,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthScale: 20,
        lineWidthMinPixels: 2,
        getFillColor: [255, 165, 0, 150], // 橙色填充
        getLineColor: [255, 69, 0, 255], // 红色边框
        getRadius: 100,
        getLineWidth: 2,
        getElevation: 0
      })
    ] : [])
  ];

  return (
    <div className="geojson-container">
      <div className="map-container">
        <DeckGL
          initialViewState={viewState}
          viewState={viewState}
          width="100%"
          height="100%"
          onViewStateChange={({ viewState, interactionState }) => {
            // 如果有矩形存在，只允许缩放操作
            if (interactiveRect) {
              // 检查是否是滚轮缩放操作
              if (interactionState && interactionState.isZooming) {
                setViewState(viewState);
                return;
              }
              return;
            }
            setViewState(viewState);
          }}
          layers={layers}
          controller={interactiveRect ? {
            scrollZoom: { speed: 2, smooth: true },
            dragPan: false,
            dragRotate: false,
            doubleClickZoom: false,
            keyboard: false,
            inertia: false,
            maxPitch: 0 // 限制最大俯视角度为0度
          } : {
            scrollZoom: { speed: 2, smooth: true },
            inertia: true,
            maxPitch: 0 // 限制最大俯视角度为0度
          }}
          onClick={(info) => {
            if (info.object && info.object.type) {
              // 阻止地图移动
              return false;
            }
            // 如果点击了矩形图层，也阻止地图移动
            if (info.layer && info.layer.id === 'interactive-rect-layer') {
              return false;
            }
          }}
        >
          <Map
            mapStyle={MAP_STYLE}
            reuseMaps
            style={{ width: '100%', height: '100%', background: '#2c353c' }}
            interactive={true}
            dragPan={!interactiveRect}
            dragRotate={!interactiveRect}
            scrollZoom={true}
            doubleClickZoom={!interactiveRect}
            keyboard={!interactiveRect}
          />
        </DeckGL>
      </div>
      
      {/* 右侧控制面板 */}
      <div className="coordinate-panel">
        <CoordinateInput 
          onCoordinateSubmit={handleCoordinateSubmit} 
          onClearMarker={handleClearMarker}
          interactiveRect={interactiveRect}
        />
        
        {/* 矩形控制面板 */}
        {interactiveRect && (
          <div className="rectangle-control-panel">
            <h4>📐 矩形区域设置</h4>
            
            {/* 名称输入 */}
            <div className="control-group">
              <h5>📝 基本信息</h5>
              <div className="control-row">
                <label>区域名称:</label>
                <input
                  type="text"
                  value={rectName}
                  onChange={(e) => setRectName(e.target.value)}
                  placeholder="请输入区域名称"
                  style={{ width: '150px' }}
                />
              </div>
            </div>
            
            {/* 位置控制 */}
            <div className="control-group">
              <h5>📍 位置坐标</h5>
              <div className="control-row">
                <label>经度:</label>
                <input
                  type="number"
                  value={interactiveRect.center.longitude.toFixed(6)}
                  onChange={(e) => {
                    const newLng = parseFloat(e.target.value);
                    if (!isNaN(newLng)) {
                      const newCorners = calculateRectCorners(
                        newLng,
                        interactiveRect.center.latitude,
                        interactiveRect.width,
                        interactiveRect.height,
                        interactiveRect.angle
                      );
                      setInteractiveRect({
                        ...interactiveRect,
                        center: { ...interactiveRect.center, longitude: newLng },
                        corners: newCorners
                      });
                    }
                  }}
                  step="0.09"
                />
              </div>
              <div className="control-row">
                <label>纬度:</label>
                <input
                  type="number"
                  value={interactiveRect.center.latitude.toFixed(6)}
                  onChange={(e) => {
                    const newLat = parseFloat(e.target.value);
                    if (!isNaN(newLat)) {
                      const newCorners = calculateRectCorners(
                        interactiveRect.center.longitude,
                        newLat,
                        interactiveRect.width,
                        interactiveRect.height,
                        interactiveRect.angle
                      );
                      setInteractiveRect({
                        ...interactiveRect,
                        center: { ...interactiveRect.center, latitude: newLat },
                        corners: newCorners
                      });
                    }
                  }}
                  step="0.09"
                />
              </div>
            </div>

            {/* 大小控制 */}
            <div className="control-group">
              <h5>📏 区域尺寸</h5>
              <div className="control-row">
                <label>宽度 (米):</label>
                <input
                  type="number"
                  value={Math.round(interactiveRect.width * 111320 * Math.cos(interactiveRect.center.latitude * Math.PI / 180))}
                  onChange={(e) => {
                    const newWidthMeters = parseFloat(e.target.value);
                    if (!isNaN(newWidthMeters) && newWidthMeters > 0) {
                      const newWidth = newWidthMeters / (111320 * Math.cos(interactiveRect.center.latitude * Math.PI / 180));
                      const newCorners = calculateRectCorners(
                        interactiveRect.center.longitude,
                        interactiveRect.center.latitude,
                        newWidth,
                        interactiveRect.height,
                        interactiveRect.angle
                      );
                      setInteractiveRect({
                        ...interactiveRect,
                        width: newWidth,
                        corners: newCorners
                      });
                    }
                  }}
                  step="10000"
                />
              </div>
              <div className="control-row">
                <label>高度 (米):</label>
                <input
                  type="number"
                  value={Math.round(interactiveRect.height * 111320)}
                  onChange={(e) => {
                    const newHeightMeters = parseFloat(e.target.value);
                    if (!isNaN(newHeightMeters) && newHeightMeters > 0) {
                      const newHeight = newHeightMeters / 111320;
                      const newCorners = calculateRectCorners(
                        interactiveRect.center.longitude,
                        interactiveRect.center.latitude,
                        interactiveRect.width,
                        newHeight,
                        interactiveRect.angle
                      );
                      setInteractiveRect({
                        ...interactiveRect,
                        height: newHeight,
                        corners: newCorners
                      });
                    }
                  }}
                  step="10000"
                />
              </div>
            </div>

            {/* 角度控制 */}
            <div className="control-group">
              <h5>🔄 旋转角度</h5>
              <div className="control-row">
                <label>旋转角度:</label>
                <input
                  type="number"
                  value={Math.round(interactiveRect.angle * 100) / 100}
                  onChange={(e) => {
                    const newAngle = parseFloat(e.target.value);
                    if (!isNaN(newAngle)) {
                      const newCorners = calculateRectCorners(
                        interactiveRect.center.longitude,
                        interactiveRect.center.latitude,
                        interactiveRect.width,
                        interactiveRect.height,
                        newAngle
                      );
                      setInteractiveRect({
                        ...interactiveRect,
                        angle: newAngle,
                        corners: newCorners
                      });
                    }
                  }}
                  step="1"
                  min="-180"
                  max="180"
                />
                <span>°</span>
              </div>
            </div>

            {/* 快捷按钮 */}
            <div className="control-group">
              <h5>⚡ 快捷操作</h5>
              <div className="button-group">
                <button onClick={() => {
                  // 重置为正方形
                  const size = Math.max(interactiveRect.width, interactiveRect.height);
                  const newCorners = calculateRectCorners(
                    interactiveRect.center.longitude,
                    interactiveRect.center.latitude,
                    size,
                    size,
                    interactiveRect.angle
                  );
                  setInteractiveRect({
                    ...interactiveRect,
                    width: size,
                    height: size,
                    corners: newCorners
                  });
                }} style={{ fontSize: '12px', padding: '6px' }}>
                  正方形
                </button>
                <button onClick={() => {
                  // 重置角度
                  const newCorners = calculateRectCorners(
                    interactiveRect.center.longitude,
                    interactiveRect.center.latitude,
                    interactiveRect.width,
                    interactiveRect.height,
                    0
                  );
                  setInteractiveRect({
                    ...interactiveRect,
                    angle: 0,
                    corners: newCorners
                  });
                }} style={{ fontSize: '12px', padding: '6px' }}>
                  重置角度
                </button>
                <button
                  onClick={sendRectData}
                  style={{
                    backgroundColor: '#2196F3',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '6px'
                  }}
                >
                  发送
                </button>
                <button
                  onClick={storeRectData}
                  style={{
                    backgroundColor: '#FF9800',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    padding: '6px'
                  }}
                >
                  存储
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 接口返回的GeoJSON数据控制面板 */}
        {apiGeoJsonData && (
          <div className="rectangle-control-panel" style={{ marginTop: '10px' }}>
            <h4>🗺️ 接口返回数据</h4>
            <div className="control-group">
              <h5>📊 数据可视化</h5>
              <div className="control-row">
                <span style={{ color: '#ffa500', fontSize: '16px' }}>●</span>
                <span style={{ marginLeft: '8px', color: '#ccc' }}>接口返回的GeoJSON数据已在地图上显示</span>
              </div>
              <div className="button-group" style={{ marginTop: '10px' }}>
                <button 
                  onClick={handleClearApiGeoJson}
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  🗑️ 清除数据
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}