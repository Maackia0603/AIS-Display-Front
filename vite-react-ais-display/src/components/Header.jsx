import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('home');
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 路由变化时自动更新选中状态
  useEffect(() => {
    setSelectedKey(location.pathname === '/' ? 'home' : '');
  }, [location]);

  // 根据鼠标距离顶部45px控制显隐
  useEffect(() => {
    const onMove = (e) => {
      if (isHovering) return; // 悬停时保持可见
      const y = e.clientY || 0;
      setIsVisible(y <= 45);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isHovering]);

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
    }
  ];

  return (
    <Menu 
      mode="horizontal" 
      items={items} 
      className={`custom-menu ${isVisible || isHovering ? 'visible' : ''}`}
      selectedKeys={[selectedKey]}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    />
  );
};

export default Header;