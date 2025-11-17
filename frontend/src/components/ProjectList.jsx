import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects/list');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleEdit = (projectName, envName) => {
    navigate(`/edit/${projectName}/${envName}`);
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container">
      <div className="header">
        <h1>项目列表</h1>
        <p>管理您的CICD配置项目</p>
        <button className="btn primary" onClick={handleCreateNew}>
          创建新项目
        </button>
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && (
        <div className="error">
          错误: {error}
          <button className="btn secondary" onClick={fetchProjects}>
            重试
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="projects-container">
          {projects.length === 0 ? (
            <div className="no-projects">
              <p>暂无项目配置</p>
              <button className="btn primary" onClick={handleCreateNew}>
                创建第一个项目
              </button>
            </div>
          ) : (
            <table className="projects-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>环境</th>
                  <th>K8S命名空间</th>
                  <th>K8S类型</th>
                  <th>Docker仓库类型</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr key={index}>
                    <td>{project.projectName}</td>
                    <td>{project.envName}</td>
                    <td>{project.namespace || '-'}</td>
                    <td>
                      {project.k8sType === 'aws' ? 'AWS EKS' : '标准K8S'}
                    </td>
                    <td>
                      {project.dockerRepositoryType === 'aws' ? 'AWS ECR' : 
                       project.dockerRepositoryType === 'standard' ? '标准仓库' : '-'}
                    </td>
                    <td>{formatDate(project.createdAt)}</td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => handleEdit(project.projectName, project.envName)}
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectList;