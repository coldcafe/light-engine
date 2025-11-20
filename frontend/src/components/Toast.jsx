import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Toast = ({ message, type = 'error', onClose, duration = 3000 }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderColor: '#c3e6cb' 
        };
      case 'warning':
        return { 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          borderColor: '#ffeaa7' 
        };
      case 'info':
        return { 
          backgroundColor: '#d1ecf1', 
          color: '#0c5460', 
          borderColor: '#bee5eb' 
        };
      case 'error':
      default:
        return { 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderColor: '#f5c6cb' 
        };
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '!';
      case 'info':
        return 'ℹ';
      case 'error':
      default:
        return '✕';
    }
  };

  return (
    <div 
      className="toast"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        border: '1px solid transparent',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        ...getTypeStyles(),
        // 使用transform和transition代替animation
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
      }}
    >
      <span className="toast-icon" style={{ fontWeight: 'bold' }}>
        {getTypeIcon()}
      </span>
      <span className="toast-message">{message}</span>
      <button 
        className="toast-close"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          marginLeft: '10px',
          color: 'inherit',
          opacity: '0.7',
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
      >
        ×
      </button>
      {/* 添加全局样式到组件外部或样式表中 */}
    </div>
  );
};

export default Toast;