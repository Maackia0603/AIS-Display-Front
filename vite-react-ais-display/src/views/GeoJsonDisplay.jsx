import React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import '../style/GeoJsonDisplay.css';

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

export default function GeoJsonDisplay() {
  return (
    <div className="geojson-container">
      <div className="map-container">
        <DeckGL
          initialViewState={initialViewState}
          controller={{
            scrollZoom: { speed: 2, smooth: true },
            inertia: true,
            maxPitch: 85
          }}
        >
          <Map
            mapStyle={MAP_STYLE}
            reuseMaps
            style={{ background: '#2c353c' }}
          />
        </DeckGL>
      </div>
      
      {/* 可以在这里添加其他组件，如侧边栏、工具栏等 */}
    </div>
  )
}
