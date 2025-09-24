import React, { useState } from 'react';
import { Button, Input, Space, Divider, Typography, message, Alert } from 'antd';
import { PlayCircleOutlined, ClearOutlined, FileTextOutlined, FormatPainterOutlined } from '@ant-design/icons';
import '../style/AgentGeoJsonInput.css';

const { TextArea } = Input;
const { Text } = Typography;

const AgentGeoJsonInput = () => {
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
      JSON.parse(geoJsonText);
      setErrorInfo(null); // 清除错误信息
      message.success('GeoJSON格式验证通过！');
      // 这里后续可以添加可视化逻辑
    } catch (error) {
      const errorMessage = `JSON解析错误：${error.message}`;
      setErrorInfo(errorMessage);
      message.error('GeoJSON格式错误，请查看详细错误信息');
    }
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
            icon={<PlayCircleOutlined />}
            onClick={handleVisualize}
          >
            验证格式
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
