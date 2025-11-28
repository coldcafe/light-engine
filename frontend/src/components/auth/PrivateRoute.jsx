import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // 如果正在加载认证状态，显示加载中
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // 如果已认证，渲染子路由
  if (isAuthenticated) {
    return <Outlet />;
  }

  // 未认证，重定向到登录页面
  return <Navigate to="/login" replace />;
};

export default PrivateRoute;