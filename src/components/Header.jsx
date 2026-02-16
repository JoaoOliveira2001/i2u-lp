import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Chip/Circuit base */}
                <rect x="20" y="20" width="60" height="60" rx="4" fill="url(#gradient)" opacity="0.9"/>
                
                {/* Letra E no centro */}
                <path d="M35 35 L35 65 M35 35 L55 35 M35 50 L50 50 M35 65 L55 65" 
                      stroke="white" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"/>
                
                {/* Pins do chip */}
                <rect x="15" y="40" width="8" height="4" rx="1" fill="url(#gradient)"/>
                <rect x="15" y="56" width="8" height="4" rx="1" fill="url(#gradient)"/>
                <rect x="77" y="40" width="8" height="4" rx="1" fill="url(#gradient)"/>
                <rect x="77" y="56" width="8" height="4" rx="1" fill="url(#gradient)"/>
                <rect x="40" y="15" width="4" height="8" rx="1" fill="url(#gradient)"/>
                <rect x="56" y="15" width="4" height="8" rx="1" fill="url(#gradient)"/>
                <rect x="40" y="77" width="4" height="8" rx="1" fill="url(#gradient)"/>
                <rect x="56" y="77" width="4" height="8" rx="1" fill="url(#gradient)"/>
                
                {/* Linhas internas do circuito */}
                <path d="M35 35 L25 35 L25 25 L75 25 L75 35 L65 35" 
                      stroke="url(#gradient)" 
                      strokeWidth="1.5" 
                      opacity="0.6"/>
                <path d="M35 65 L25 65 L25 75 L75 75 L75 65 L65 65" 
                      stroke="url(#gradient)" 
                      strokeWidth="1.5" 
                      opacity="0.6"/>
                
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-main">INTEGRATION2U</span>
              <span className="logo-sub">DIGITAL SERVICE</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
