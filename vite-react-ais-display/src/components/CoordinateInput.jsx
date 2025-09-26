import React, { useState } from 'react';
import '../style/CoordinateInput.css';

const CoordinateInput = ({ 
  onCoordinateSubmit, 
  onClearMarker,
  interactiveRect
}) => {
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [error, setError] = useState('');

  const validateCoordinate = (value, type) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return `${type}必须是有效数字`;
    }
    if (type === '经度' && (num < -180 || num > 180)) {
      return '经度范围应在-180到180之间';
    }
    if (type === '纬度' && (num < -90 || num > 90)) {
      return '纬度范围应在-90到90之间';
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const lonError = validateCoordinate(longitude, '经度');
    const latError = validateCoordinate(latitude, '纬度');

    if (lonError || latError) {
      setError(lonError || latError);
      return;
    }

    const coord = {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    };

    onCoordinateSubmit(coord);
  };

  const handleReset = () => {
    setLongitude('');
    setLatitude('');
    setError('');
  };

  const handleClearMarker = () => {
    if (onClearMarker) {
      onClearMarker();
    }
  };

  return (
    <div className="coordinate-input-container">
      <div className="coordinate-input-header">
        <h3>坐标定位</h3>
        <p>输入经纬度坐标定位到地图</p>
      </div>
      
      <form onSubmit={handleSubmit} className="coordinate-form">
        <div className="input-group">
          <label htmlFor="longitude">经度 (Longitude)</label>
          <input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="例如: -74.05"
            className="coordinate-input"
          />
        </div>

        <div className="input-group">
          <label htmlFor="latitude">纬度 (Latitude)</label>
          <input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="例如: 40.72"
            className="coordinate-input"
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="button-group">
          <button type="submit" className="submit-btn">
            定位到地图
          </button>
          <button type="button" onClick={handleReset} className="reset-btn">
            重置
          </button>
        </div>
        
        <div className="button-group">
          <button type="button" onClick={handleClearMarker} className="clear-btn">
            清除标记点
          </button>
        </div>
      </form>

      {/* 可交互矩形信息 */}
      {interactiveRect && (
        <div className="interactive-instruction">
          <h5>可交互矩形操作</h5>
          <ul>
            <li>拖拽矩形内部：移动整个矩形</li>
            <li>拖拽角点：调整矩形大小</li>
            <li>拖拽边中点：调整对应边的大小</li>
            <li>拖拽黄色旋转点：旋转矩形</li>
          </ul>
          
          <div className="rect-info">
            <h6>矩形信息</h6>
            <div className="result-item">
              <span className="label">中心点坐标:</span>
              <span className="value">
                {interactiveRect.center.longitude.toFixed(6)}, {interactiveRect.center.latitude.toFixed(6)}
              </span>
            </div>
            <div className="result-item">
              <span className="label">宽度:</span>
              <span className="value">{Math.round(interactiveRect.width * 111320 * Math.cos(interactiveRect.center.latitude * Math.PI / 180))} 米</span>
            </div>
            <div className="result-item">
              <span className="label">高度:</span>
              <span className="value">{Math.round(interactiveRect.height * 111320)} 米</span>
            </div>
            <div className="result-item">
              <span className="label">旋转角度:</span>
              <span className="value">{Math.round(interactiveRect.angle * 100) / 100}°</span>
            </div>
          </div>
        </div>
      )}

      <div className="coordinate-info">
        <h4>坐标格式说明</h4>
        <ul>
          <li>经度范围: -180° 到 180°</li>
          <li>纬度范围: -90° 到 90°</li>
          <li>支持小数格式，如: 40.7128</li>
          <li>正数表示北纬/东经，负数表示南纬/西经</li>
        </ul>
      </div>
    </div>
  );
};

export default CoordinateInput;
