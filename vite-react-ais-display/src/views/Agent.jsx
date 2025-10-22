import React, { useState, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import { GeoJsonLayer } from '@deck.gl/layers';
import '../style/Agent.css';
import Agentaside from '../components/Agentaside.jsx';

const initialViewState = {
  longitude: -74, // 经度
  latitude: 40.72, // 纬度
  zoom: 13, // 缩放大小
  pitch: 45, // 地图倾斜角度
  bearing: 0, // 地图旋转角度
  minZoom: 1, // 最小缩放级别
  maxZoom: 20 // 最大缩放级别
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

function Agent() {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [viewState, setViewState] = useState(initialViewState);
  const deckRef = useRef(null);

  // 计算 GeoJSON 数据的边界框
  const calculateBounds = (geoJson) => {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    const processCoordinates = (coords, type) => {
      if (type === 'Point') {
        minLng = Math.min(minLng, coords[0]);
        maxLng = Math.max(maxLng, coords[0]);
        minLat = Math.min(minLat, coords[1]);
        maxLat = Math.max(maxLat, coords[1]);
      } else if (type === 'LineString' || (type === 'Polygon' && coords.length > 0)) {
        const coordArray = type === 'LineString' ? coords : coords[0];
        coordArray.forEach(coord => {
          minLng = Math.min(minLng, coord[0]);
          maxLng = Math.max(maxLng, coord[0]);
          minLat = Math.min(minLat, coord[1]);
          maxLat = Math.max(maxLat, coord[1]);
        });
      } else if (type === 'MultiPolygon') {
        coords.forEach(polygon => {
          polygon[0].forEach(coord => {
            minLng = Math.min(minLng, coord[0]);
            maxLng = Math.max(maxLng, coord[0]);
            minLat = Math.min(minLat, coord[1]);
            maxLat = Math.max(maxLat, coord[1]);
          });
        });
      }
    };

    if (geoJson.type === 'FeatureCollection') {
      geoJson.features.forEach(feature => {
        processCoordinates(feature.geometry.coordinates, feature.geometry.type);
      });
    } else if (geoJson.type === 'Feature') {
      processCoordinates(geoJson.geometry.coordinates, geoJson.geometry.type);
    }

    return { minLng, maxLng, minLat, maxLat };
  };

  // 聚焦到 GeoJSON 区域
  const focusOnGeoJson = useCallback((geoJson) => {
    try {
      const bounds = calculateBounds(geoJson);
      
      // 检查边界是否有效
      if (!isFinite(bounds.minLng) || !isFinite(bounds.maxLng) || 
          !isFinite(bounds.minLat) || !isFinite(bounds.maxLat)) {
        console.warn('无效的边界值，使用默认视图');
        return;
      }
      
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      
      // 计算合适的缩放级别 - 优化算法
      const lngDiff = bounds.maxLng - bounds.minLng;
      const latDiff = bounds.maxLat - bounds.minLat;
      const maxDiff = Math.max(lngDiff, latDiff);
      
      // 更精确的缩放级别计算 - 稍微拉远视角
      let zoom = 12; // 默认缩放级别（比之前更远）
      if (maxDiff > 50) zoom = 1;      // 全球范围
      else if (maxDiff > 20) zoom = 3;  // 大洲范围
      else if (maxDiff > 10) zoom = 5;  // 国家范围
      else if (maxDiff > 5) zoom = 7;   // 省份范围
      else if (maxDiff > 2) zoom = 9;   // 城市范围
      else if (maxDiff > 1) zoom = 11;  // 区域范围
      else if (maxDiff > 0.5) zoom = 13; // 街区范围
      else if (maxDiff > 0.1) zoom = 15; // 建筑范围
      else zoom = 16; // 非常小的区域

      setViewState(prev => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom,
        pitch: 0, // 重置倾斜角度以便更好地查看
        bearing: 0, // 重置旋转角度
        transitionDuration: 1500 // 增加动画时间
      }));

      // 添加成功提示
      console.log(`成功聚焦到数据区域: 中心(${centerLng.toFixed(4)}, ${centerLat.toFixed(4)}), 缩放级别: ${zoom}`);
      
    } catch (error) {
      console.error('聚焦到GeoJSON时出错:', error);
    }
  }, [setViewState]);

  // 处理 GeoJSON 数据更新
  const handleGeoJsonUpdate = (geoJson) => {
    setGeoJsonData(geoJson);
    if (geoJson) {
      focusOnGeoJson(geoJson);
    }
  };

  // 全局函数
  React.useEffect(() => {
    // 只聚焦不更新数据的函数
    window.focusOnGeoJsonOnly = (geoJson) => {
      if (geoJson) {
        focusOnGeoJson(geoJson);
      }
    };

    // 只更新数据不聚焦的函数
    window.updateGeoJsonOnly = (geoJson) => {
      setGeoJsonData(geoJson);
      // 不调用 focusOnGeoJson
    };

    // 清理函数
    return () => {
      delete window.focusOnGeoJsonOnly;
      delete window.updateGeoJsonOnly;
    };
  }, [focusOnGeoJson]);

  // 创建 GeoJSON 图层
  const layers = geoJsonData ? [
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: geoJsonData,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,
      lineWidthScale: 20,
      lineWidthMinPixels: 3,
      getRadius: 150,
      getLineWidth: 3,
      getElevation: 50,
      // 根据几何类型设置不同颜色
      getFillColor: (feature) => {
        const geometryType = feature.geometry?.type;
        switch (geometryType) {
          case 'Point':
            return [0, 255, 0, 200];        // 绿色点
          case 'LineString':
            return [0, 0, 255, 200];        // 蓝色线
          case 'Polygon':
            return [255, 0, 0, 180];        // 红色多边形
          case 'MultiPolygon':
            return [255, 165, 0, 180];      // 橙色多多边形
          case 'MultiPoint':
            return [0, 255, 255, 200];      // 青色多点
          case 'MultiLineString':
            return [128, 0, 128, 200];      // 紫色多线
          default:
            return [255, 0, 0, 180];        // 默认红色
        }
      },
      getLineColor: (feature) => {
        const geometryType = feature.geometry?.type;
        switch (geometryType) {
          case 'Point':
            return [0, 200, 0, 255];        // 深绿色边框
          case 'LineString':
            return [0, 0, 200, 255];        // 深蓝色边框
          case 'Polygon':
            return [200, 0, 0, 255];        // 深红色边框
          case 'MultiPolygon':
            return [200, 100, 0, 255];      // 深橙色边框
          case 'MultiPoint':
            return [0, 200, 200, 255];      // 深青色边框
          case 'MultiLineString':
            return [100, 0, 100, 255];      // 深紫色边框
          default:
            return [200, 0, 0, 255];        // 默认深红色边框
        }
      }
    })
  ] : [];

  return (
    <div className="agent-container">
      <div className="map-container">
        <DeckGL
          ref={deckRef}
          viewState={viewState}
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={{
            scrollZoom: { speed: 2, smooth: true },
            inertia: true,
            maxPitch: 85
          }}
          layers={layers}
        >
          <Map
            mapStyle={MAP_STYLE}
            reuseMaps
            style={{ background: '#2c353c' }}
          />
        </DeckGL>
      </div>

      {/* 右侧可拉伸聊天面板组件 */}
      <Agentaside onGeoJsonUpdate={handleGeoJsonUpdate} />
    </div>
  )
}

export default Agent
