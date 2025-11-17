import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <h1>{t('projectList.title')}</h1>
        <p>{t('projectList.description')}</p>
        <button className="btn primary" onClick={handleCreateNew}>
          {t('projectList.createNewProject')}
        </button>
      </div>

      {loading && <div className="loading">{t('common.loading')}...</div>}
      {error && (
        <div className="error">
          {t('errors.error')}: {error}
          <button className="btn secondary" onClick={fetchProjects}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="projects-container">
          {projects.length === 0 ? (
            <div className="no-projects">
              <p>{t('projectList.noProjects')}</p>
              <button className="btn primary" onClick={handleCreateNew}>
                {t('projectList.createFirstProject')}
              </button>
            </div>
          ) : (
            <table className="projects-table">
              <thead>
                <tr>
                  <th>{t('projectList.tableHeaders.projectName')}</th>
                  <th>{t('projectList.tableHeaders.env')}</th>
                  <th>{t('projectList.tableHeaders.namespace')}</th>
                  <th>{t('projectList.tableHeaders.k8sType')}</th>
                  <th>{t('projectList.tableHeaders.dockerRepoType')}</th>
                  <th>{t('projectList.tableHeaders.createdAt')}</th>
                  <th>{t('projectList.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, index) => (
                  <tr key={index}>
                    <td>{project.projectName}</td>
                    <td>{project.envName}</td>
                    <td>{project.namespace || '-'}</td>
                    <td>
                      {project.k8sType === 'aws' ? t('projectList.k8sTypes.aws') : t('projectList.k8sTypes.standard')}
                    </td>
                    <td>
                      {project.dockerRepositoryType === 'aws' ? t('projectList.dockerRepoTypes.aws') : 
                       project.dockerRepositoryType === 'standard' ? t('projectList.dockerRepoTypes.standard') : '-'}
                    </td>
                    <td>{formatDate(project.createdAt)}</td>
                    <td>
                      <button
                        className="btn secondary"
                        onClick={() => handleEdit(project.projectName, project.envName)}
                      >
                        {t('common.edit')}
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