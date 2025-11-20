import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// 添加样式对象
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  headerTitle: {
    marginBottom: '10px',
    fontSize: '24px',
    fontWeight: '600'
  },
  headerDescription: {
    marginBottom: '20px',
    color: '#666',
    fontSize: '16px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  appsContainer: {
    marginTop: '20px'
  },
  noApps: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px dashed #ddd'
  },
  noAppsText: {
    marginBottom: '20px',
    color: '#666',
    fontSize: '16px'
  },
  appsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableHeaderCell: {
    padding: '15px 20px',
    textAlign: 'left',
    borderBottom: '1px solid #e0e0e0'
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  tableCell: {
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'middle'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
    '&:hover': {
      backgroundColor: '#0056b3'
    }
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    '&:hover': {
      backgroundColor: '#545b62'
    }
  },
  dangerButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    '&:hover': {
      backgroundColor: '#c82333'
    }
  },
  loading: {
    textAlign: 'center',
    padding: '40px 20px',
    fontSize: '16px',
    color: '#666'
  },
  error: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
    '& button': {
      marginTop: '10px'
    }
  }
};

const AppList = () => {
  const { projectName, envName } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/apps/${projectName}/${envName}/list`);
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }
      const data = await response.json();
      setApps(data.apps);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  }, [projectName, envName]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleEdit = (appName) => {
    navigate(`/app/edit/${projectName}/${envName}/${appName}`);
  };

  const handleCreateNew = () => {
    navigate(`/app/create/${projectName}/${envName}`);
  };

  const handleBackToProjects = () => {
    navigate('/');
  };

  const handleDelete = async (appName) => {
    if (window.confirm(t('appList.confirmDelete', { appName }))) {
      try {
        const response = await fetch(`/api/apps/${projectName}/${envName}/delete/${appName}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to delete app');
        }
        fetchApps();
      } catch (err) {
        setError(err.message);
        console.error('Error deleting app:', err);
      }
    }
  };

  const handleDeploy = async (appName) => {
    if (window.confirm(t('appList.confirmDeploy', { appName }))) {
      try {
        setLoading(true);
        const response = await fetch(`/api/apps/${projectName}/${envName}/deploy/${appName}`, {
          method: 'POST'
        });
        if (!response.ok) {
          throw new Error('Failed to deploy app');
        }
        const data = await response.json();
        alert(t('appList.deploySuccess', { appName }));
        fetchApps();
      } catch (err) {
        setError(err.message);
        console.error('Error deploying app:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>{t('appList.title', { projectName, envName })}</h1>
        <p style={styles.headerDescription}>{t('appList.description')}</p>
        <div style={styles.headerActions}>
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleBackToProjects}>
            {t('appList.backToProjects')}
          </button>
          <button style={{...styles.button, ...styles.primaryButton}} onClick={handleCreateNew}>
            {t('appList.createNewApp')}
          </button>
        </div>
      </div>

      {loading && <div style={styles.loading}>{t('common.loading')}...</div>}
      {error && (
        <div style={styles.error}>
          {t('errors.error')}: {error}
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={fetchApps}>
            {t('common.retry')}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={styles.appsContainer}>
          {apps.length === 0 ? (
            <div style={styles.noApps}>
              <p style={styles.noAppsText}>{t('appList.noApps')}</p>
              <button style={{...styles.button, ...styles.primaryButton}} onClick={handleCreateNew}>
                {t('appList.createFirstApp')}
              </button>
            </div>
          ) : (
            <table className="apps-table">
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>{t('appList.tableHeaders.appName')}</th>
                  <th style={styles.tableHeaderCell}>{t('appList.tableHeaders.replicas')}</th>
                  <th style={styles.tableHeaderCell}>{t('appList.tableHeaders.host')}</th>
                  <th style={styles.tableHeaderCell}>{t('appList.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.tableCell}>{app.appName}</td>
                    <td style={styles.tableCell}>{app.replicas}</td>
                    <td style={styles.tableCell}>
                      {app.ingress ? (
                        <div>
                          <small>{app.ingress.host || '-'}</small>
                        </div>
                      ) : (
                        '-'                    
                      )}
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#6c757d',
                            color: 'white'
                          }}
                          onClick={() => handleEdit(app.appName)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#28a745',
                            color: 'white'
                          }}
                          onClick={() => handleDeploy(app.appName)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#218838';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#28a745';
                          }}
                        >
                          {t('common.deploy')}
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#dc3545',
                            color: 'white'
                          }}
                          onClick={() => handleDelete(app.appName)}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#c82333';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#dc3545';
                          }}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
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

export default AppList;