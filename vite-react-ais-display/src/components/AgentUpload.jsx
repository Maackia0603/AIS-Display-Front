import React from 'react';
import '../style/AgentAside.css';

const AgentUpload = () => {
  return (
    <div className="page-content">
      <div className="page-title">文件上传</div>
      <div className="page-description">上传文件用于AI分析和处理</div>
      <div className="upload-area">
        <div className="upload-box">
          <div className="upload-icon">📁</div>
          <div className="upload-text">点击或拖拽文件到这里上传</div>
          <div className="upload-hint">支持 .txt, .md, .csv, .json, .pdf 等格式</div>
        </div>
      </div>
    </div>
  );
};

export default AgentUpload;
