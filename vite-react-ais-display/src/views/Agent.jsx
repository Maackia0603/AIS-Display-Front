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
      
      // 计算合适的缩放级别
      const lngDiff = bounds.maxLng - bounds.minLng;
      const latDiff = bounds.maxLat - bounds.minLat;
      const maxDiff = Math.max(lngDiff, latDiff);
      
      let zoom = 13;
      if (maxDiff > 10) zoom = 4;
      else if (maxDiff > 5) zoom = 6;
      else if (maxDiff > 1) zoom = 8;
      else if (maxDiff > 0.1) zoom = 11;
      else zoom = 14;

      setViewState(prev => ({
        ...prev,
        longitude: centerLng,
        latitude: centerLat,
        zoom: zoom,
        transitionDuration: 1000
      }));
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
      lineWidthMinPixels: 2,
      getFillColor: [160, 160, 180, 200],
      getLineColor: [80, 80, 80, 255],
      getRadius: 100,
      getLineWidth: 1,
      getElevation: 30
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
