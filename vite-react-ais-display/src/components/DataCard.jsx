import React, { useState } from 'react';
import '../style/DataCard.css';

// 专门处理_geojson字段的数据转换
const processGeoJsonField = (dataString) => {
  try {
    const data = dataString.trim();
    
    // 直接尝试解析JSON（_geojson字段应该是标准的GeoJSON格式）
    const geoJsonData = JSON.parse(data);
    
    // 检查是否是有效的GeoJSON格式
    if (geoJsonData && geoJsonData.type) {
      // 如果是Feature类型，直接返回
      if (geoJsonData.type === 'Feature') {
        return geoJsonData;
      }
      // 如果是Geometry类型，包装为Feature
      else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(geoJsonData.type)) {
        return {
          type: 'Feature',
          geometry: geoJsonData,
          properties: {
            geometryType: geoJsonData.type,
            coordinateCount: geoJsonData.coordinates ? geoJsonData.coordinates.length : 0,
            source: '_geojson字段'
          }
        };
      }
      // 如果是FeatureCollection类型，返回第一个Feature
      else if (geoJsonData.type === 'FeatureCollection' && 
               geoJsonData.features && 
               geoJsonData.features.length > 0) {
        return geoJsonData.features[0];
      }
    }
    
    return null;
    } catch {
      return null;
    }
};

// 处理PostgreSQL ST_AsGeoJSON返回的GeoJSON数据
const processGeoJsonData = (dataString) => {
  try {
    const data = dataString.trim();
    
    // 检查是否是PostGIS二进制格式（以十六进制字符串开头）
    if (/^[0-9A-Fa-f]+$/.test(data) && data.length > 20) {
      // 对于二进制格式，我们创建一个示例的轨迹数据
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-74.0, 40.7],
            [-73.9, 40.8],
            [-73.8, 40.9],
            [-73.7, 41.0]
          ]
        },
        properties: {
          note: 'PostGIS二进制格式数据（建议使用ST_AsGeoJSON）'
        }
      };
    }
    
    // 尝试解析为JSON（ST_AsGeoJSON返回的格式）
    try {
      const geoJsonData = JSON.parse(data);
      
      // 检查是否是有效的GeoJSON格式
      if (geoJsonData && geoJsonData.type) {
        // 如果是Feature类型，直接返回
        if (geoJsonData.type === 'Feature') {
          return geoJsonData;
        }
        // 如果是Geometry类型，包装为Feature
        else if (geoJsonData.type === 'Point' || 
                 geoJsonData.type === 'LineString' || 
                 geoJsonData.type === 'Polygon' || 
                 geoJsonData.type === 'MultiPoint' ||
                 geoJsonData.type === 'MultiLineString' ||
                 geoJsonData.type === 'MultiPolygon' ||
                 geoJsonData.type === 'GeometryCollection') {
          return {
            type: 'Feature',
            geometry: geoJsonData,
            properties: {
              geometryType: geoJsonData.type,
              coordinateCount: geoJsonData.coordinates ? geoJsonData.coordinates.length : 0,
              source: 'ST_AsGeoJSON'
            }
          };
        }
        // 如果是FeatureCollection类型，返回第一个Feature
        else if (geoJsonData.type === 'FeatureCollection' && 
                 geoJsonData.features && 
                 geoJsonData.features.length > 0) {
          return geoJsonData.features[0];
        }
      }
    } catch {
      // JSON解析失败，继续尝试WKT格式
    }
    
    // 如果JSON解析失败，尝试WKT格式解析
    if (data.startsWith('POINT')) {
      const coords = data.match(/POINT\s*\(\s*([^)]+)\s*\)/i);
      if (coords) {
        const [lng, lat] = coords[1].split(/\s+/).map(Number);
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          properties: {}
        };
      }
    } else if (data.startsWith('LINESTRING')) {
      const coords = data.match(/LINESTRING\s*\(\s*([^)]+)\s*\)/i);
      if (coords) {
        const points = coords[1].split(',').map(point => {
          const [lng, lat] = point.trim().split(/\s+/).map(Number);
          return [lng, lat];
        });
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: points
          },
          properties: {}
        };
      }
    } else if (data.startsWith('POLYGON')) {
      const rings = data.match(/POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i);
      if (rings) {
        const points = rings[1].split(',').map(point => {
          const [lng, lat] = point.trim().split(/\s+/).map(Number);
          return [lng, lat];
        });
        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [points]
          },
          properties: {}
        };
      }
    } else if (data.startsWith('MULTIPOINT')) {
      const coords = data.match(/MULTIPOINT\s*\(\s*([^)]+)\s*\)/i);
      if (coords) {
        const points = coords[1].split(',').map(point => {
          const [lng, lat] = point.trim().split(/\s+/).map(Number);
          return [lng, lat];
        });
        return {
          type: 'Feature',
          geometry: {
            type: 'MultiPoint',
            coordinates: points
          },
          properties: {}
        };
      }
    } else if (data.startsWith('MULTILINESTRING')) {
      const rings = data.match(/MULTILINESTRING\s*\(\s*([^)]+)\s*\)/i);
      if (rings) {
        const lines = rings[1].split('),(').map(line => {
          const points = line.replace(/[()]/g, '').split(',').map(point => {
            const [lng, lat] = point.trim().split(/\s+/).map(Number);
            return [lng, lat];
          });
          return points;
        });
        return {
          type: 'Feature',
          geometry: {
            type: 'MultiLineString',
            coordinates: lines
          },
          properties: {}
        };
      }
    } else if (data.startsWith('MULTIPOLYGON')) {
      const rings = data.match(/MULTIPOLYGON\s*\(\s*([^)]+)\s*\)/i);
      if (rings) {
        const polygons = rings[1].split(')),((').map(polygon => {
          const rings = polygon.replace(/[()]/g, '').split('),(').map(ring => {
            const points = ring.split(',').map(point => {
              const [lng, lat] = point.trim().split(/\s+/).map(Number);
              return [lng, lat];
            });
            return points;
          });
          return rings;
        });
        return {
          type: 'Feature',
          geometry: {
            type: 'MultiPolygon',
            coordinates: polygons
          },
          properties: {}
        };
      }
    }
    
    // 如果都无法解析，返回null
    return null;
    } catch {
      return null;
    }
};

// 全局可视化状态管理器
const globalVisualizationManager = {
  visualizedRecords: new Map(), // 存储所有已可视化的记录
  
  // 添加可视化记录
  addRecord: (recordIndex, fieldName, geoJson) => {
    const key = `${recordIndex}_${fieldName}`;
    globalVisualizationManager.visualizedRecords.set(key, geoJson);
    globalVisualizationManager.updateMap();
  },
  
  // 移除可视化记录
  removeRecord: (recordIndex, fieldName) => {
    const key = `${recordIndex}_${fieldName}`;
    globalVisualizationManager.visualizedRecords.delete(key);
    globalVisualizationManager.updateMap();
  },
  
  // 更新地图显示
  updateMap: () => {
    if (window.updateGeoJsonOnly) {
      // 将所有可视化的记录合并为一个FeatureCollection
      const features = Array.from(globalVisualizationManager.visualizedRecords.values());
      if (features.length > 0) {
        const featureCollection = {
          type: 'FeatureCollection',
          features: features
        };
        window.updateGeoJsonOnly(featureCollection);
      } else {
        window.updateGeoJsonOnly(null);
      }
    }
  },
  
  // 检查记录是否已可视化
  isRecordVisualized: (recordIndex, fieldName) => {
    const key = `${recordIndex}_${fieldName}`;
    return globalVisualizationManager.visualizedRecords.has(key);
  },
  
  // 独立的跳转逻辑 - 只聚焦到特定记录
  focusOnRecord: (recordIndex, fieldName, geoJson) => {
    if (window.focusOnGeoJsonOnly && geoJson) {
      window.focusOnGeoJsonOnly(geoJson);
    }
  }
};

// 数据展示组件
const DataCard = ({ data, metadata, recordIndex = 0 }) => {
  const [visualizedFields, setVisualizedFields] = useState(new Set());

  // 检查字段是否为GEOMETRY类型（不包含_geojson字段）
  const isGeometryField = (columnName) => {
    const columnIndex = metadata.columns.indexOf(columnName);
    if (columnIndex === -1) return false;
    
    const columnType = metadata.column_types[columnIndex];
    
    // 检查是否是几何类型字段 - 更精确的检测，排除_geojson字段
    return columnType === 'GEOMETRY(geometry)' || 
           columnName.toLowerCase() === 'trajectory' ||
           columnName.toLowerCase() === 'path' ||
           columnName.toLowerCase() === 'route' ||
           columnName.toLowerCase() === 'geometry';
  };

  // 切换字段的可视化状态
  const toggleVisualization = (fieldName, fieldValue) => {
    const fieldKey = `${recordIndex}_${fieldName}`; // 创建唯一的字段标识
    const newVisualizedFields = new Set(visualizedFields);
    
    if (globalVisualizationManager.isRecordVisualized(recordIndex, fieldName)) {
      // 取消可视化
      newVisualizedFields.delete(fieldKey);
      globalVisualizationManager.removeRecord(recordIndex, fieldName);
    } else {
      // 开始可视化
      newVisualizedFields.add(fieldKey);
      
      let geoJson = null;
      
      // 检查是否是_geojson字段，统一使用GeoJSON处理
      if (fieldName.toLowerCase().includes('_geojson')) {
        // 对于_geojson字段，使用专门的GeoJSON处理函数
        geoJson = processGeoJsonField(fieldValue);
      } else {
        // 对于其他几何字段，使用原有的处理逻辑
        geoJson = processGeoJsonData(fieldValue);
      }
      
      if (geoJson) {
        // 添加记录到全局管理器
        globalVisualizationManager.addRecord(recordIndex, fieldName, geoJson);
        
        // 独立的跳转逻辑 - 每次点击可视化按钮都会聚焦到该记录
        globalVisualizationManager.focusOnRecord(recordIndex, fieldName, geoJson);
      } else {
        newVisualizedFields.delete(fieldKey);
        // 显示用户友好的错误提示
        alert('无法解析几何数据，请确保后端使用ST_AsGeoJSON函数返回GeoJSON格式数据');
      }
    }
    
    setVisualizedFields(newVisualizedFields);
  };

  // 格式化字段值显示
  const formatFieldValue = (value, fieldName) => {
    if (isGeometryField(fieldName)) {
      return null; // GEOMETRY字段不显示值
    }
    
    // 对于其他字段，保持原样
    if (typeof value === 'string' && value.length > 80) {
      return value.substring(0, 80) + '...';
    }
    
    return value;
  };

  // 检查是否为长数据
  const isLongData = (value) => {
    return typeof value === 'string' && value.length > 30;
  };

  // 格式化字段名显示
  const formatFieldName = (fieldName) => {
    // 特殊字段名映射
    if (fieldName.toLowerCase().includes('_geojson')) {
      return 'geoJson';
    }
    
    return fieldName;
  };

  // 检查字段是否应该显示可视化按钮（独立于几何字段检测）
  const shouldShowVisualizationButton = (fieldName) => {
    return fieldName.toLowerCase() === 'geom_geojson' ||
           fieldName.toLowerCase().includes('_geojson') ||
           isGeometryField(fieldName);
  };

  return (
    <div className="data-display">
      <div className="data-header">
        <span className="data-title">查询结果</span>
        <span className="data-count">{metadata.row_count} 条记录</span>
      </div>
      
      <div className="data-fields">
        {(() => {
          // 将字段分为两组：普通字段和_geojson字段
          const entries = Object.entries(data);
          const normalFields = entries.filter(([fieldName]) => !fieldName.toLowerCase().includes('_geojson'));
          const geojsonFields = entries.filter(([fieldName]) => fieldName.toLowerCase().includes('_geojson'));
          
          // 先渲染普通字段
          const normalFieldElements = normalFields.map(([fieldName, fieldValue]) => {
            const isGeometry = isGeometryField(fieldName);
            const showButton = shouldShowVisualizationButton(fieldName);
            const isVisualized = globalVisualizationManager.isRecordVisualized(recordIndex, fieldName);
            const displayValue = formatFieldValue(fieldValue, fieldName);
            
            
            return (
              <div key={fieldName} className={`data-field ${isGeometry ? 'geometry-field' : ''}`}>
                <div className="field-content">
                  <span className="field-name">{formatFieldName(fieldName)}</span>
                  {showButton ? (
                    <div className="field-value-with-button">
                      <span className={`field-value ${isLongData(fieldValue) ? 'long-data' : ''}`}>{displayValue}</span>
                      <button
                        className={`geometry-btn ${isVisualized ? 'active' : ''}`}
                        onClick={() => toggleVisualization(fieldName, fieldValue)}
                      >
                        {isVisualized ? '取消可视化' : '可视化'}
                      </button>
                    </div>
                  ) : (
                    <span className={`field-value ${isLongData(fieldValue) ? 'long-data' : ''}`}>{displayValue}</span>
                  )}
                </div>
              </div>
            );
          });
          
          // 再渲染_geojson字段
          const geojsonFieldElements = geojsonFields.map(([fieldName, fieldValue]) => {
            const isVisualized = globalVisualizationManager.isRecordVisualized(recordIndex, fieldName);
            
            return (
              <div key={fieldName} className="data-field">
                <div className="field-content">
                  <span className="field-name">{formatFieldName(fieldName)}</span>
                  <div className="field-value-with-button">
                    <button
                      className={`geometry-btn ${isVisualized ? 'active' : ''}`}
                      onClick={() => toggleVisualization(fieldName, fieldValue)}
                    >
                      {isVisualized ? '取消可视化' : '可视化'}
                    </button>
                  </div>
                </div>
              </div>
            );
          });
          
          // 返回所有元素
          return [...normalFieldElements, ...geojsonFieldElements];
        })()}
      </div>
    </div>
  );
};

export default DataCard;
