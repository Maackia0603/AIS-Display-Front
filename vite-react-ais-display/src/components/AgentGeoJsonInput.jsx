import React, { useState } from 'react';
import { Button, Input, Space, Divider, Typography, message, Alert } from 'antd';
import { EyeOutlined, ClearOutlined, FileTextOutlined, FormatPainterOutlined } from '@ant-design/icons';
import '../style/AgentGeoJsonInput.css';

const { TextArea } = Input;
const { Text } = Typography;

const AgentGeoJsonInput = ({ onGeoJsonUpdate = null }) => {
  const [geoJsonText, setGeoJsonText] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);

  const sampleGeoJson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "多边形区域A",
          "description": "示例多边形区域"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [116.3974, 39.9042],
              [116.4074, 39.9042],
              [116.4074, 39.9142],
              [116.3974, 39.9142],
              [116.3974, 39.9042]
            ]
          ]
        }
      }
    ]
  };

  const handleLoadSample = () => {
    // 加载压缩格式的JSON，方便测试美化功能
    setGeoJsonText(JSON.stringify(sampleGeoJson));
    setErrorInfo(null); // 清除错误信息
    message.info('示例数据已加载（压缩格式）');
  };

  const handleClear = () => {
    setGeoJsonText('');
    setErrorInfo(null); // 清除错误信息
    message.info('数据已清空');
  };

  const handleVisualize = () => {
    if (!geoJsonText.trim()) {
      message.warning('请输入GeoJSON数据');
      return;
    }
    
    try {
      const parsedGeoJson = JSON.parse(geoJsonText);
      
      // 验证是否是有效的 GeoJSON 格式
      if (!isValidGeoJson(parsedGeoJson)) {
        setErrorInfo('数据格式不符合 GeoJSON 规范，请检查数据结构');
        message.error('GeoJSON 格式不正确');
        return;
      }
      
      setErrorInfo(null); // 清除错误信息
      
      // 调用回调函数更新地图
      if (onGeoJsonUpdate) {
        onGeoJsonUpdate(parsedGeoJson);
      }
      
      message.success('GeoJSON 数据已成功可视化到地图！');
    } catch (error) {
      const errorMessage = `JSON解析错误：${error.message}`;
      setErrorInfo(errorMessage);
      message.error('JSON格式错误，请查看详细错误信息');
    }
  };

  // 验证 GeoJSON 格式
  const isValidGeoJson = (geoJson) => {
    if (!geoJson || typeof geoJson !== 'object') return false;
    
    // 检查是否是 FeatureCollection
    if (geoJson.type === 'FeatureCollection') {
      return geoJson.features && Array.isArray(geoJson.features) &&
             geoJson.features.every(feature => isValidFeature(feature));
    }
    
    // 检查是否是单个 Feature
    if (geoJson.type === 'Feature') {
      return isValidFeature(geoJson);
    }
    
    // 检查是否是几何对象
    if (isValidGeometry(geoJson)) {
      return true;
    }
    
    return false;
  };

  // 验证 Feature 对象
  const isValidFeature = (feature) => {
    return feature && 
           feature.type === 'Feature' &&
           feature.geometry &&
           isValidGeometry(feature.geometry);
  };

  // 验证几何对象
  const isValidGeometry = (geometry) => {
    if (!geometry || !geometry.type || !geometry.coordinates) return false;
    
    const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    return validTypes.includes(geometry.type) && Array.isArray(geometry.coordinates);
  };

  const handleBeautify = () => {
    if (!geoJsonText.trim()) {
      message.warning('请输入JSON数据');
      return;
    }
    
    try {
      const parsedJson = JSON.parse(geoJsonText);
      const beautifiedJson = JSON.stringify(parsedJson, null, 2);
      setGeoJsonText(beautifiedJson);
      setErrorInfo(null); // 清除错误信息
      message.success('JSON格式化完成！');
    } catch (error) {
      const errorMessage = `JSON解析错误：${error.message}`;
      setErrorInfo(errorMessage);
      console.error('JSON解析错误:', error);
      message.error('JSON格式错误，请查看详细错误信息');
    }
  };


  return (
    <div className="agent-geojson-input">
      {/* 头部操作区 */}
      <div className="input-header">
        <div className="header-title">
          <FileTextOutlined className="title-icon" />
          <Text strong>GeoJSON 数据输入</Text>
        </div>
        
        <Button 
          size="small"
          onClick={handleLoadSample}
        >
          示例
        </Button>
      </div>

      <Divider className="header-divider" />


      {/* 输入区域 */}
      <div className="input-area">
        <TextArea
          value={geoJsonText}
          onChange={(e) => {
            setGeoJsonText(e.target.value);
            // 用户输入时清除错误信息
            if (errorInfo) {
              setErrorInfo(null);
            }
          }}
          placeholder="请输入GeoJSON数据，或点击上方按钮加载示例..."
          className="geojson-textarea"
          rows={15}
        />
      </div>

      {/* 错误信息显示区域 */}
      {errorInfo && (
        <div className="error-display" style={{ margin: '12px 0' }}>
          <Alert
            message="JSON 格式错误"
            description={errorInfo}
            type="error"
            showIcon
            closable
            onClose={() => setErrorInfo(null)}
          />
        </div>
      )}

      {/* 底部操作按钮 */}
      <div className="input-footer">
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handleVisualize}
          >
            可视化到地图
          </Button>
          <Button
            icon={<FormatPainterOutlined />}
            onClick={handleBeautify}
          >
            美化格式
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={handleClear}
          >
            清空
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default AgentGeoJsonInput;
