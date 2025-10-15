import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../style/Header.css';

function Header() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">AIS-Display</span>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/home" 
            className={`nav-link ${isActive('/home') ? 'active' : ''}`}
          >
            首页
          </Link>
          <Link 
            to="/geojsondisplay" 
            className={`nav-link ${isActive('/geojsondisplay') ? 'active' : ''}`}
          >
            地图显示
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
