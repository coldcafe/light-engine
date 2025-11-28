import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { api } from '../../api/apiService';

const LoginPage = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const { token } = response.data;
      
      // 使用auth context中的login方法更新认证状态
      login(token, username);
      
      // 通知父组件登录成功
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        // 如果没有提供回调，直接导航到首页
        navigate('/');
      }
      
      // 无论如何都确保导航，双重保险
      setTimeout(() => {
        navigate('/');
      }, 100);

    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{t('auth.loginTitle')}</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary"
              disabled={loading}
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;