import React from 'react';
import '../style/AgentAside.css';

const AgentDocument = () => {
  return (
    <div className="page-content">
      <div className="page-title">文档管理</div>
      <div className="page-description">管理和查看您的文档资料</div>
      <div className="document-list">
        <div className="document-item">
          <div className="doc-icon">📄</div>
          <div className="doc-info">
            <div className="doc-name">项目说明.md</div>
            <div className="doc-size">2.3 KB</div>
          </div>
        </div>
        <div className="document-item">
          <div className="doc-icon">📊</div>
          <div className="doc-info">
            <div className="doc-name">数据分析报告.xlsx</div>
            <div className="doc-size">1.2 MB</div>
          </div>
        </div>
        <div className="document-item">
          <div className="doc-icon">📋</div>
          <div className="doc-info">
            <div className="doc-name">需求文档.pdf</div>
            <div className="doc-size">856 KB</div>
          </div>
        </div>
        <div className="document-item">
          <div className="doc-icon">📝</div>
          <div className="doc-info">
            <div className="doc-name">会议记录.txt</div>
            <div className="doc-size">156 KB</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDocument;
