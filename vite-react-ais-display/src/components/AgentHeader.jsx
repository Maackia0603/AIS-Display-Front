import React from 'react';
import { Segmented } from 'antd';
import { MessageOutlined, FileTextOutlined, UploadOutlined, SettingOutlined } from '@ant-design/icons';
import '../style/AgentHeader.css';

const AgentHeader = ({ activeTab = 'chat', onTabChange }) => {
  const options = [
    {
      label: '对话',
      value: 'chat',
      icon: <MessageOutlined />
    },
    {
      label: '文档',
      value: 'document',
      icon: <FileTextOutlined />
    },
    {
      label: '上传',
      value: 'upload',
      icon: <UploadOutlined />
    },
    {
      label: '设置',
      value: 'settings',
      icon: <SettingOutlined />
    }
  ];

  return (
    <div className="agent-header">
      <div className="agent-header-content">
        <Segmented
          value={activeTab}
          options={options}
          onChange={onTabChange}
          className="agent-header-menu"
        />
      </div>
    </div>
  );
};

export default AgentHeader;
