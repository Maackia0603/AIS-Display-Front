import React, { useState, useEffect } from 'react';
import { Button, Input, Space, Divider, Typography, message, Alert, Select, Checkbox, List, Collapse } from 'antd';
import { EyeOutlined, ClearOutlined, FileTextOutlined, FormatPainterOutlined, SaveOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import '../style/AgentGeoJsonInput.css';

const { TextArea } = Input;
const { Text } = Typography;

const AgentGeoJsonInput = ({ onGeoJsonUpdate = null }) => {
  const [geoJsonText, setGeoJsonText] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);
  const [savedVisualizations, setSavedVisualizations] = useState([]);
  const [selectedVisualization, setSelectedVisualization] = useState(null);
  const [currentGeoJsonData, setCurrentGeoJsonData] = useState(null);
  const [checkedVisualizations, setCheckedVisualizations] = useState(new Set());

  // 从localStorage加载已保存的可视化内容
  useEffect(() => {
    const saved = localStorage.getItem('savedGeoJsonVisualizations');
    if (saved) {
      try {
        setSavedVisualizations(JSON.parse(saved));
      } catch (error) {
        console.error('加载保存的数据时出错:', error);
      }
    }
  }, []);

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
    setCurrentGeoJsonData(null); // 清空当前可视化数据
    
    // 更新地图显示（只显示勾选的保存内容）
    if (checkedVisualizations.size > 0) {
      // 传递null作为当前数据，确保只显示勾选的保存内容
      updateMapWithCheckedVisualizationsAndCurrent(checkedVisualizations, null);
    } else {
      // 如果没有勾选任何内容，清空地图
      if (onGeoJsonUpdate) {
        onGeoJsonUpdate(null);
      }
    }
    
    message.info('数据已清空');
  };

  // 保存当前可视化内容
  const handleSave = () => {
    if (!currentGeoJsonData) {
      message.warning('请先可视化数据后再保存');
      return;
    }

    const timestamp = new Date().toLocaleString('zh-CN');
    const newVisualization = {
      id: Date.now().toString(),
      name: `可视化内容 ${timestamp}`,
      data: currentGeoJsonData,
      timestamp: timestamp,
      originalText: geoJsonText
    };

    const updatedVisualizations = [...savedVisualizations, newVisualization];
    setSavedVisualizations(updatedVisualizations);
    
    // 保存到localStorage
    localStorage.setItem('savedGeoJsonVisualizations', JSON.stringify(updatedVisualizations));
    
    // 清空输入框和当前可视化数据
    setGeoJsonText('');
    setErrorInfo(null);
    setCurrentGeoJsonData(null);
    
    // 自动勾选新保存的数据
    const newCheckedSet = new Set(checkedVisualizations);
    newCheckedSet.add(newVisualization.id);
    setCheckedVisualizations(newCheckedSet);
    
    // 显示包含新保存数据的所有勾选内容（传递更新后的数据列表）
    updateMapWithCheckedVisualizationsAndCurrentWithData(newCheckedSet, null, updatedVisualizations);
    
    message.success(`已保存可视化内容: ${newVisualization.name.replace('可视化内容 ', '')}`);
  };


  // 删除已保存的可视化内容
  const handleDeleteSaved = (visualizationId) => {
    const updatedVisualizations = savedVisualizations.filter(v => v.id !== visualizationId);
    setSavedVisualizations(updatedVisualizations);
    localStorage.setItem('savedGeoJsonVisualizations', JSON.stringify(updatedVisualizations));
    
    // 从勾选状态中移除
    const newCheckedSet = new Set(checkedVisualizations);
    newCheckedSet.delete(visualizationId);
    setCheckedVisualizations(newCheckedSet);
    
    if (selectedVisualization === visualizationId) {
      setSelectedVisualization(null);
    }
    
    // 更新地图显示
    updateMapWithCheckedVisualizations(newCheckedSet);
    
    message.success('已删除保存的内容');
  };

  // 清空所有保存的内容
  const handleClearAllSaved = () => {
    setSavedVisualizations([]);
    localStorage.removeItem('savedGeoJsonVisualizations');
    setSelectedVisualization(null);
    setCurrentGeoJsonData(null);
    setCheckedVisualizations(new Set());
    if (onGeoJsonUpdate) {
      onGeoJsonUpdate(null);
    }
    message.success('已清空所有保存的内容');
  };

  // 处理勾选状态变化
  const handleCheckVisualization = (visualizationId, checked) => {
    const newCheckedSet = new Set(checkedVisualizations);
    if (checked) {
      newCheckedSet.add(visualizationId);
    } else {
      newCheckedSet.delete(visualizationId);
    }
    setCheckedVisualizations(newCheckedSet);
    
    // 更新地图显示
    updateMapWithCheckedVisualizations(newCheckedSet);
  };

  // 处理点击已保存数据项
  const handleClickVisualization = (visualizationId) => {
    const visualization = savedVisualizations.find(v => v.id === visualizationId);
    if (!visualization) return;

    // 如果没有勾选，先勾选
    if (!checkedVisualizations.has(visualizationId)) {
      const newCheckedSet = new Set(checkedVisualizations);
      newCheckedSet.add(visualizationId);
      setCheckedVisualizations(newCheckedSet);
      
      // 更新地图显示
      updateMapWithCheckedVisualizations(newCheckedSet);
    }

    // 聚焦到该数据
    if (onGeoJsonUpdate) {
      // 使用原始的onGeoJsonUpdate来聚焦，但只传递该数据用于聚焦计算
      setTimeout(() => {
        // 创建一个临时的GeoJSON只用于聚焦
        const focusGeoJson = visualization.data;
        // 先更新viewState进行聚焦，但不改变显示的数据
        if (window.focusOnGeoJsonOnly) {
          window.focusOnGeoJsonOnly(focusGeoJson);
        } else {
          // 备用方案：直接聚焦
          onGeoJsonUpdate(focusGeoJson);
          // 然后立即恢复正确的显示数据
          setTimeout(() => {
            const newCheckedSet = new Set(checkedVisualizations);
            newCheckedSet.add(visualizationId);
            updateMapWithCheckedVisualizations(newCheckedSet);
          }, 100);
        }
      }, 50);
    }
  };

  // 合并选中的可视化数据并更新地图
  const updateMapWithCheckedVisualizations = (checkedSet) => {
    updateMapWithCheckedVisualizationsAndCurrent(checkedSet, currentGeoJsonData);
  };

  // 合并选中的可视化数据和指定的当前数据并更新地图
  const updateMapWithCheckedVisualizationsAndCurrent = (checkedSet, currentData) => {
    updateMapWithCheckedVisualizationsAndCurrentWithData(checkedSet, currentData, savedVisualizations);
  };

  // 合并选中的可视化数据和指定的当前数据并更新地图（使用指定的数据列表）
  const updateMapWithCheckedVisualizationsAndCurrentWithData = (checkedSet, currentData, visualizationsList) => {
    if (checkedSet.size === 0) {
      // 如果没有选中任何内容，显示当前输入的数据（如果有）
      if (onGeoJsonUpdate) {
        onGeoJsonUpdate(currentData);
      }
      return;
    }

    // 收集所有选中的可视化数据（使用传入的数据列表）
    const selectedData = Array.from(checkedSet).map(id => {
      return visualizationsList.find(v => v.id === id)?.data;
    }).filter(Boolean);

    if (selectedData.length === 0 && !currentData) return;

    // 合并所有选中的数据
    const allFeatures = [];
    selectedData.forEach((geoJsonData, index) => {
      if (geoJsonData.type === 'FeatureCollection') {
        // 为每个Feature添加来源标识
        const featuresWithSource = geoJsonData.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            _sourceIndex: index,
            _sourceName: `保存内容 ${index + 1}`
          }
        }));
        allFeatures.push(...featuresWithSource);
      } else if (geoJsonData.type === 'Feature') {
        allFeatures.push({
          ...geoJsonData,
          properties: {
            ...geoJsonData.properties,
            _sourceIndex: index,
            _sourceName: `保存内容 ${index + 1}`
          }
        });
      }
    });

    // 如果还有当前输入的数据，也加入合并（但不包括已保存的重复数据）
    if (currentData && !Array.from(checkedSet).some(id => {
      const vis = visualizationsList.find(v => v.id === id);
      return vis && JSON.stringify(vis.data) === JSON.stringify(currentData);
    })) {
      if (currentData.type === 'FeatureCollection') {
        const currentFeatures = currentData.features.map(feature => ({
          ...feature,
          properties: {
            ...feature.properties,
            _sourceIndex: selectedData.length,
            _sourceName: '当前输入'
          }
        }));
        allFeatures.push(...currentFeatures);
      } else if (currentData.type === 'Feature') {
        allFeatures.push({
          ...currentData,
          properties: {
            ...currentData.properties,
            _sourceIndex: selectedData.length,
            _sourceName: '当前输入'
          }
        });
      }
    }

    // 如果没有任何特征，显示当前数据
    if (allFeatures.length === 0 && currentData) {
      if (onGeoJsonUpdate) {
        onGeoJsonUpdate(currentData);
      }
      return;
    }

    // 创建合并后的FeatureCollection
    const mergedGeoJson = {
      type: 'FeatureCollection',
      features: allFeatures
    };

    if (onGeoJsonUpdate) {
      // 使用只更新数据不聚焦的方法
      if (window.updateGeoJsonOnly) {
        window.updateGeoJsonOnly(mergedGeoJson);
      } else {
        onGeoJsonUpdate(mergedGeoJson);
      }
    }
  };

  const handleVisualize = () => {
    if (!geoJsonText.trim()) {
      message.warning('请输入GeoJSON数据');
      return;
    }
    
    try {
      // 预处理输入的文本，处理转义的双引号
      let processedText = geoJsonText.trim();
      
      // 处理双引号转义 ("" -> ")
      processedText = processedText.replace(/""/g, '"');
      
      // 如果文本被额外的引号包围，去掉外层引号
      if (processedText.startsWith('"') && processedText.endsWith('"')) {
        processedText = processedText.slice(1, -1);
      }
      
      const parsedGeoJson = JSON.parse(processedText);
      
      // 如果输入的是几何对象（如 MultiPolygon），自动包装成 Feature
      let finalGeoJson = parsedGeoJson;
      if (isValidGeometry(parsedGeoJson) && !parsedGeoJson.type.includes('Feature')) {
        finalGeoJson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "导入的几何对象",
                description: "从输入数据自动生成"
              },
              geometry: parsedGeoJson
            }
          ]
        };
        message.info('检测到几何对象，已自动包装为 FeatureCollection');
      }
      
      // 验证是否是有效的 GeoJSON 格式
      if (!isValidGeoJson(finalGeoJson)) {
        setErrorInfo('数据格式不符合 GeoJSON 规范，请检查数据结构');
        message.error('GeoJSON 格式不正确');
        return;
      }
      
      setErrorInfo(null); // 清除错误信息
      
      // 保存当前可视化数据
      setCurrentGeoJsonData(finalGeoJson);
      
      // 如果有选中的保存内容，需要合并显示
      if (checkedVisualizations.size > 0) {
        // 直接传递新的数据进行合并，避免状态更新延迟
        updateMapWithCheckedVisualizationsAndCurrent(checkedVisualizations, finalGeoJson);
        // 但只聚焦到新输入的数据
        setTimeout(() => {
          if (window.focusOnGeoJsonOnly) {
            window.focusOnGeoJsonOnly(finalGeoJson);
          }
        }, 100);
      } else {
        // 调用回调函数更新地图（会自动聚焦）
        if (onGeoJsonUpdate) {
          onGeoJsonUpdate(finalGeoJson);
        }
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
      // 预处理输入的文本，处理转义的双引号
      let processedText = geoJsonText.trim();
      
      // 处理双引号转义 ("" -> ")
      processedText = processedText.replace(/""/g, '"');
      
      // 如果文本被额外的引号包围，去掉外层引号
      if (processedText.startsWith('"') && processedText.endsWith('"')) {
        processedText = processedText.slice(1, -1);
      }
      
      const parsedJson = JSON.parse(processedText);
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

      {/* 已保存内容选择区 */}
      {savedVisualizations.length > 0 && (
        <div className="saved-selector" style={{ marginBottom: '12px' }}>
          <Collapse
            size="small"
            ghost
            expandIcon={({ isActive }) => <DownOutlined rotate={isActive ? 180 : 0} />}
            items={[
              {
                key: '1',
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text strong style={{ fontSize: '13px' }}>
                      已保存内容 ({savedVisualizations.length})
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {checkedVisualizations.size > 0 ? `${checkedVisualizations.size}个已选中` : '勾选显示'}
                    </Text>
                  </div>
                ),
                extra: (
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllSaved();
                    }}
                    style={{ fontSize: '11px', height: '24px' }}
                  >
                    清空
                  </Button>
                ),
                children: (
                  <List
                    size="small"
                    bordered
                    dataSource={savedVisualizations}
                    renderItem={(visualization) => (
                      <List.Item
                        style={{ 
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          minHeight: '32px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                          // 检查点击是否来自勾选框或删除按钮
                          if (e.target.closest('.ant-checkbox') || e.target.closest('.ant-btn')) {
                            return; // 如果是，不处理点击
                          }
                          handleClickVisualization(visualization.id);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Checkbox
                            checked={checkedVisualizations.has(visualization.id)}
                            onChange={(e) => {
                              e.stopPropagation(); // 防止触发父元素的点击
                              handleCheckVisualization(visualization.id, e.target.checked);
                            }}
                            style={{ marginRight: '6px' }}
                          />
                          <div style={{ flex: 1, lineHeight: '1.2' }}>
                            <div style={{ 
                              fontSize: '12px', 
                              fontWeight: '500',
                              color: checkedVisualizations.has(visualization.id) ? '#1890ff' : 'inherit'
                            }}>
                              {visualization.name.replace('可视化内容 ', '')}
                            </div>
                            <div style={{ fontSize: '10px', color: '#999', marginTop: '1px' }}>
                              点击聚焦到此数据
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="small" 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发父元素的点击
                            handleDeleteSaved(visualization.id);
                          }}
                          style={{ marginLeft: '6px', fontSize: '11px', height: '20px', width: '20px' }}
                        />
                      </List.Item>
                    )}
                    style={{ maxHeight: '100px', overflowY: 'auto' }}
                  />
                )
              }
            ]}
          />
        </div>
      )}

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
          rows={10}
        />
      </div>

      {/* 错误信息显示区域 */}
      {errorInfo && (
        <div className="error-display" style={{ margin: '8px 0' }}>
          <Alert
            message="JSON 格式错误"
            description={errorInfo}
            type="error"
            showIcon
            closable
            onClose={() => setErrorInfo(null)}
            style={{ fontSize: '12px' }}
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
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!currentGeoJsonData}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            保存可视化
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
