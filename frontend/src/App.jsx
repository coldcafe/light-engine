import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ProjectList from './components/ProjectList.jsx'
import ProjectForm from './components/ProjectForm.jsx'
import ProjectEdit from './components/ProjectEdit.jsx'

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>Light Engine - CICD配置管理</h1>
            <nav className="app-nav">
              <Link to="/" className="nav-link">项目列表</Link>
              <Link to="/create" className="nav-link btn small">创建项目</Link>
            </nav>
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/create" element={<ProjectForm />} />
            <Route path="/edit/:projectName/:envName" element={<ProjectEdit />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>&copy; 2024 Light Engine - CICD配置管理工具</p>
        </footer>
      </div>
    </Router>
  )
}

export default App