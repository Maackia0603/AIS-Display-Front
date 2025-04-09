import React from 'react';
import { Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import logo from '../../public/logo.png'
import '../style/Header.css'

const Header = () => {
  const navigate = useNavigate()
  const logoItem = {
    key: 'logo',
    label: (
      <img 
        src={logo} 
        alt="logo" 
        style={{ 
          height: '35px', 
          cursor: 'pointer' 
        }}
        onClick={() => navigate('/')}
      />
    ),
    disabled: true, 
  };
  const items = [
    logoItem,
    {
      key: 'home',
      label: (
        <a onClick={()=>navigate('/')}>
          首页
        </a>
      ),
    },
    {
      key: 'display',
      label: (
        <a onClick={()=>navigate('/display')}>
          轨迹
        </a>
      ),
    },
  ];
  return <Menu mode="horizontal" items={items} className="custom-menu"/>;
};
export default Header;