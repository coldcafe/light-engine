import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查是否有存储的token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (token) {
      try {
        // 解码token获取用户信息
        const decoded = jwtDecode(token);
        
        // 检查token是否过期
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          setIsAuthenticated(true);
          setUser({
            username,
            ...decoded
          });
        } else {
          // Token过期，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        }
      } catch (error) {
        // Token无效，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    }
    
    setLoading(false);
  }, []);

  // 登录方法
  const login = (token, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    
    try {
      const decoded = jwtDecode(token);
      setUser({
        username,
        ...decoded
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Invalid token:', error);
    }
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUser(null);
  };

  // 获取当前用户信息
  const getCurrentUser = () => {
    return user;
  };

  // 检查认证状态
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp > currentTime) {
        return true;
      }
    } catch (error) {
      console.error('Invalid token:', error);
    }

    return false;
  };

  // 提供的上下文值
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    getCurrentUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义hook，方便使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;