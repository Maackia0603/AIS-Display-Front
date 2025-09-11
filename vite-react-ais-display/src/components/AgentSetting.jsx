import React from 'react';
import '../style/AgentAside.css';

const AgentSetting = () => {
  return (
    <div className="page-content">
      <div className="page-title">设置</div>
      <div className="page-description">配置您的偏好设置</div>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-label">主题模式</div>
          <div className="setting-value">自动</div>
        </div>
        <div className="setting-item">
          <div className="setting-label">语言设置</div>
          <div className="setting-value">简体中文</div>
        </div>
        <div className="setting-item">
          <div className="setting-label">AI 模型</div>
          <div className="setting-value">GPT-4</div>
        </div>
        <div className="setting-item">
          <div className="setting-label">自动保存</div>
          <div className="setting-value">开启</div>
        </div>
        <div className="setting-item">
          <div className="setting-label">消息通知</div>
          <div className="setting-value">开启</div>
        </div>
      </div>
    </div>
  );
};

export default AgentSetting;
