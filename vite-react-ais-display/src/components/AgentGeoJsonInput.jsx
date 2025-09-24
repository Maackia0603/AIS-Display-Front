import React, { useState } from 'react';
import { Button, Input, Space, Divider, Typography, message } from 'antd';
import { PlayCircleOutlined, ClearOutlined, FileTextOutlined } from '@ant-design/icons';
import '../style/AgentGeoJsonInput.css';

const { TextArea } = Input;
const { Text } = Typography;

const AgentGeoJsonInput = () => {
  const [geoJsonText, setGeoJsonText] = useState('');

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
          "type": "MultiPolygon",
          "coordinates": [
            [[[2.000667596, 40.9995], [0.999332404, 40.9995], [0.999332404, 41.043193172], [1.7897344, 41.2255211], [2.000667596, 40.9995]]]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "多边形区域B",
          "description": "另一个示例多边形区域"
        },
        "geometry": {
          "type": "MultiPolygon",
          "coordinates": [
            [[[1.5, 41.0], [1.0, 41.0], [1.0, 41.5], [1.5, 41.5], [1.5, 41.0]]],
            [[[2.5, 40.8], [2.0, 40.8], [2.0, 41.3], [2.5, 41.3], [2.5, 40.8]]]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "简单多边形",
          "description": "单个多边形示例"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [[1.2, 40.7], [1.8, 40.7], [1.8, 41.1], [1.2, 41.1], [1.2, 40.7]]
          ]
        }
      }
    ]
  };

  const handleLoadSample = () => {
    setGeoJsonText(JSON.stringify(sampleGeoJson, null, 2));
    message.info('示例数据已加载');
  };

  const handleClear = () => {
    setGeoJsonText('');
    message.info('数据已清空');
  };

  const handleVisualize = () => {
    if (!geoJsonText.trim()) {
      message.warning('请输入GeoJSON数据');
      return;
    }
    
    try {
      JSON.parse(geoJsonText);
      message.success('GeoJSON格式验证通过！');
      // 这里后续可以添加可视化逻辑
    } catch {
      message.error('GeoJSON格式错误，请检查数据格式');
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
          onChange={(e) => setGeoJsonText(e.target.value)}
          placeholder="请输入GeoJSON数据，或点击上方按钮加载示例..."
          className="geojson-textarea"
          rows={15}
        />
      </div>

      {/* 底部操作按钮 */}
      <div className="input-footer">
        <Space>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleVisualize}
          >
            验证格式
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
