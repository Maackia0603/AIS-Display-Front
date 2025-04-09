import React from 'react';
import DeckGL from '@deck.gl/react';
import { animate } from 'popmotion';
import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { TripsLayer } from '@deck.gl/geo-layers';
import { useEffect, useState } from 'react';
import { Map } from 'react-map-gl/maplibre';


const ambientLight = new AmbientLight({
    color: [255, 255, 255],
    intensity: 1.0
  });
  
const pointLight = new PointLight({
    color: [255, 255, 255],
    intensity: 2.0,
    position: [-74.05, 40.7, 8000]
  });

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const initialViewState = { // 初始底图设置
  longitude: -74, // 经度
  latitude: 40.72, // 纬度
  zoom: 13, // 缩放大小
  pitch: 45, // 地图倾斜角度
  bearing: 0 // 地图旋转角度
}

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';

function Display({
    loopLength = 1800, // 最大时间戳值
    animationSpeed = 3, // 通过速度系数调整动画快慢
    trailLength = 180, // 轨迹持续长度
    // 轨迹数据
    trips = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/trips-v7.json'
}) {
    const [time, setTime] = useState(0);

    useEffect(() => {
        const animation = animate({
            from: 0, // 动画起始值
            to: loopLength, // 动画结束值
            duration: (loopLength * 60) / animationSpeed, // 动画单次循环的持续时间（单位：毫秒）
            repeat: Infinity, // 动画循环模式
            onUpdate: setTime // 动画更新时的回调函数
        });
        return () => animation.stop();
    }, [loopLength, animationSpeed]);

    const layers = [
        new TripsLayer({
          id: 'trips',
          data: trips,
          getPath: d => d.path, // data中的路线
          getTimestamps: d => d.timestamps, // data中的时间戳信息
          getColor: [253, 128, 93], // 线路颜色，后可根据不同船舶类型更改颜色
          opacity: 0.3, // 轨迹透明度（30%）
          widthMinPixels: 2, // 轨迹线最小宽度（像素）
          rounded: true, // 轨迹线末端圆角效果
          trailLength, // 显示轨迹的持续时间（单位与时间戳一致）
          currentTime: time, // 当前时间指针（驱动动画）
          shadowEnabled: false // 禁用阴影投射
        })
      ];
  return (
    <div style={{
        position: 'absolute', 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
    }}>
        <DeckGL
            layers={layers}
            effects={[lightingEffect]}
            initialViewState={initialViewState}
            controller={true}
            >
            <Map 
                mapStyle={MAP_STYLE}
                reuseMaps
                />
        </DeckGL>
    </div>
  )
}

export default Display
