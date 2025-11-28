import React from 'react';
// Updated import section
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProjectList from './components/ProjectList.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import ProjectEdit from './components/ProjectEdit.jsx';
import AppList from './components/AppList.jsx';
import AppForm from './components/AppForm.jsx';
import LanguageSwitcher from './components/LanguageSwitcher.jsx';
import LoginPage from './components/auth/LoginPage.jsx';
import { AuthProvider, useAuth } from './components/auth/AuthContext.jsx';
import PrivateRoute from './components/auth/PrivateRoute.jsx';

// 主应用内容组件
function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>{t('header.title')} - {t('header.subtitle')}</h1>
          <nav className="app-nav">
            {isAuthenticated && (
              <>
                <Link to="/" className="nav-link">{t('projectList.title')}</Link>
                <Link to="/create" className="nav-link btn small">{t('projectList.createNewProject')}</Link>
                <button onClick={handleLogout} className="logout-btn">{t('common.logout')}</button>
              </>
            )}
            <LanguageSwitcher />
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          
          {/* 受保护的路由 */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<ProjectList />} />
            <Route path="/create" element={<ProjectForm />} />
            <Route path="/edit/:projectName/:envName" element={<ProjectEdit />} />
            <Route path="/apps/:projectName/:envName" element={<AppList />} />
            <Route path="/app/create/:projectName/:envName" element={<AppForm />} />
            <Route path="/app/edit/:projectName/:envName/:appName" element={<AppForm />} />
          </Route>
        </Routes>
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 {t('header.title')} - {t('header.subtitle')}</p>
      </footer>
    </div>
  );
}

// 根应用组件，包裹认证提供者
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;