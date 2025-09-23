import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('home');
  // 路由变化时自动更新选中状态
  useEffect(() => {
    setSelectedKey(location.pathname === '/' ? 'home' : '');
  }, [location]);

  const handleLogoClick = () => {
    navigate('/');
    setSelectedKey('home');
  };

  const logoItem = {
    key: 'logo',
    label: (
      <img 
        src="/logo.png"
        alt="logo" 
        style={{ height: '35px', cursor: 'pointer' }}
        onClick={handleLogoClick}
      />
    ),
    disabled: true,
  };

  const items = [
    logoItem,
    {
      key: 'home',
      label: (
        <a onClick={() => {
          navigate('/');
          setSelectedKey('home'); 
        }}>
          首页
        </a>
      ),
    },
    {
      key: 'display',
      label: (
        <a onClick={() => {
          navigate('/display');
          setSelectedKey('display');
        }}>
          轨迹
        </a>
      ),
    },
    {
      key: 'agent',
      label: (
        <a onClick={() => {
          navigate('/agent');
          setSelectedKey('agent');
        }}>
          智能体
        </a>
      ),
    },
    {
      key: 'geojsondisplay',
      label: (
        <a onClick={() => {
          navigate('/geojsondisplay');
          setSelectedKey('geojsondisplay');
        }}>
          信息显示
        </a>
      ),
    }
  ];

  return (
    <Menu 
      mode="horizontal" 
      items={items} 
      className="custom-menu"
      selectedKeys={[selectedKey]}
    />
  );
};

export default Header;