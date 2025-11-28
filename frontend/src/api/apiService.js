import axios from 'axios';

// 创建axios实例
const apiService = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证token
apiService.interceptors.request.use(
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
apiService.interceptors.response.use(
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
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// 导出带有拦截器的axios实例
export default apiService;

// 导出通用的API方法，方便组件调用
export const api = {
  get: (url, params) => apiService.get(url, { params }),
  post: (url, data) => apiService.post(url, data),
  put: (url, data) => apiService.put(url, data),
  delete: (url) => apiService.delete(url),
  patch: (url, data) => apiService.patch(url, data)
};