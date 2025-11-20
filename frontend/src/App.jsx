import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProjectList from './components/ProjectList.jsx'
import ProjectForm from './components/ProjectForm.jsx'
import ProjectEdit from './components/ProjectEdit.jsx'
import AppList from './components/AppList.jsx'
import AppForm from './components/AppForm.jsx'
import LanguageSwitcher from './components/LanguageSwitcher.jsx'

function App() {
  const { t } = useTranslation();
  
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>{t('header.title')} - {t('header.subtitle')}</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">{t('projectList.title')}</Link>
              <Link to="/create" className="nav-link btn small">{t('projectList.createNewProject')}</Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/create" element={<ProjectForm />} />
            <Route path="/edit/:projectName/:envName" element={<ProjectEdit />} />
            <Route path="/apps/:projectName/:envName" element={<AppList />} />
            <Route path="/app/create/:projectName/:envName" element={<AppForm />} />
            <Route path="/app/edit/:projectName/:envName/:appName" element={<AppForm />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>&copy; 2025 {t('header.title')} - {t('header.subtitle')}</p>
        </footer>
      </div>
    </Router>
  )
}

export default App