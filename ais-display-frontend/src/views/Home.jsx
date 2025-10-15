import React from 'react';
import { Link } from 'react-router-dom';
import '../style/Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>AIS显示系统</h1>
        <p>欢迎使用AIS显示前端系统</p>
        
        <div className="feature-cards">
          <div className="feature-card">
            <h3>🗺️ GeoJson地图显示</h3>
            <p>支持GeoJson数据的地图可视化显示</p>
            <Link to="/geojsondisplay" className="feature-link">
              进入地图
            </Link>
          </div>
          
          <div className="feature-card">
            <h3>📍 坐标定位</h3>
            <p>通过经纬度坐标快速定位到地图</p>
            <Link to="/geojsondisplay" className="feature-link">
              开始定位
            </Link>
          </div>
          
          <div className="feature-card">
            <h3>📐 区域绘制</h3>
            <p>在地图上绘制和编辑矩形区域</p>
            <Link to="/geojsondisplay" className="feature-link">
              绘制区域
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
