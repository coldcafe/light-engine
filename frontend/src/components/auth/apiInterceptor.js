import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    
    // 如果token存在，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      // 跳转到登录页面
      // 注意：这里不能直接使用useNavigate，因为hooks只能在组件中使用
      // 我们将在App.jsx中处理这种情况
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// 导出带有拦截器的axios实例
export default api;

// 导出一个函数，用于处理401错误的重定向
// 这个函数可以在组件中使用useNavigate调用
export const handleUnauthorized = (navigate) => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  navigate('/login');
};