import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Toast from './Toast';

const ProjectEdit = () => {
  const { projectName, envName } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
      namespace: '',
      k8sType: 'standard',
      k8sConf: '',
      clusterName: '', // clusterName移至顶层
      awsConfig: {
        region: '',
        accessKey: '',
        secretKey: '',
        albs: [{ // 添加ALB配置数组
          name: '',
          certificateARNs: [''],
          subnets: {
            ids: ['']
          }
        }]
      },
      dockerRepositoryType: 'standard',
      dockerRepositoryUrl: '',
      dockerRepositoryUsername: '',
      dockerRepositoryPassword: ''
    });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadProjectData();
  }, [projectName, envName]);

  // 处理URL锚点滚动功能
  useEffect(() => {
    if (!loading) {
      // 检查URL中的锚点
      const hash = window.location.hash;
      if (hash) {
        // 延迟执行，确保所有DOM元素都已渲染
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [loading]);

  const loadProjectData = async () => {
        try {
          setLoading(true);
          // 由于我们没有专门的获取单个项目详情的API，我们需要获取完整配置
          // 从后端获取项目列表
          const response = await fetch('/api/projects/list');
          if (!response.ok) {
            throw new Error('Failed to fetch project data');
          }
          const data = await response.json();
          const project = data.projects.find(
            p => p.projectName === projectName && p.envName === envName
          );
          
          if (project) {
            // 从文件系统获取完整配置
            // 在实际应用中，这里应该通过一个专门的API来获取这些详细配置
            const configResponse = await fetch(`/api/projects/detail/${projectName}/${envName}`);
            let detailedConfig = {};
            
            if (configResponse.ok) {
              detailedConfig = await configResponse.json();
            } else {
              // 如果没有专门的detail API，我们尝试通过一个额外的API请求来获取配置
              console.warn('No detail API available, using basic information');
            }
            
            // 构建表单数据
            const newFormData = {
              namespace: project.namespace || '',
              k8sType: project.k8sType,
              k8sConf: '', // 不显示kube_conf内容
              clusterName: detailedConfig.clusterName || '', // 直接从response顶层获取clusterName
              awsConfig: detailedConfig.awsConfig ? {
                region: detailedConfig.awsConfig.region || '',
                accessKey: detailedConfig.awsConfig.accessKey || '',
                secretKey: '', // 不显示AWS Secret Key
                albs: detailedConfig.awsConfig.albs && detailedConfig.awsConfig.albs.length > 0 
                  ? detailedConfig.awsConfig.albs 
                  : [{ name: '', certificateARNs: [''], subnets: { ids: [''] } }]
              } : {
                region: '',
                accessKey: '',
                secretKey: '',
                albs: [{ name: '', certificateARNs: [''], subnets: { ids: [''] } }]
              },
              dockerRepositoryType: project.dockerRepositoryType || 'standard',
              dockerRepositoryUrl: detailedConfig.dockerRepositoryUrl || '',
              dockerRepositoryUsername: detailedConfig.dockerRepositoryUsername || '',
              dockerRepositoryPassword: detailedConfig.dockerRepositoryPassword || ''
            };
            
            setFormData(newFormData);
          }
        } catch (err) {
      // 使用toast显示加载错误
      setToast({
        message: err.message,
        type: 'error'
      });
      console.error(t('errors.loadingProjectFailed'), err);
    } finally {
          setLoading(false);
        }
      };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAwsConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        [field]: value
      }
    }));
  };

  // ALB相关处理函数
  const updateAlb = (index, albData) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => 
          i === index ? { ...alb, ...albData } : alb
        )
      }
    }));
  };

  const addAlb = () => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: [...prev.awsConfig.albs, {
          name: '',
          certificateARNs: [''],
          subnets: {
            ids: ['']
          }
        }]
      }
    }));
  };

  const removeAlb = (index) => {
    if (formData.awsConfig.albs.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.filter((_, i) => i !== index)
      }
    }));
  };

  // 证书相关处理函数
  const addCertificate = (albIndex) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            return {
              ...alb,
              certificateARNs: [...alb.certificateARNs, '']
            };
          }
          return alb;
        })
      }
    }));
  };

  const removeCertificate = (albIndex, certIndex) => {
    if (formData.awsConfig.albs[albIndex].certificateARNs.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            return {
              ...alb,
              certificateARNs: alb.certificateARNs.filter((_, j) => j !== certIndex)
            };
          }
          return alb;
        })
      }
    }));
  };

  const updateCertificate = (albIndex, certIndex, value) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            const newCertificates = [...alb.certificateARNs];
            newCertificates[certIndex] = value;
            return {
              ...alb,
              certificateARNs: newCertificates
            };
          }
          return alb;
        })
      }
    }));
  };

  // 子网相关处理函数
  const addSubnet = (albIndex) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            return {
              ...alb,
              subnets: {
                ...alb.subnets,
                ids: [...alb.subnets.ids, '']
              }
            };
          }
          return alb;
        })
      }
    }));
  };

  const removeSubnet = (albIndex, subnetIndex) => {
    if (formData.awsConfig.albs[albIndex].subnets.ids.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            return {
              ...alb,
              subnets: {
                ...alb.subnets,
                ids: alb.subnets.ids.filter((_, j) => j !== subnetIndex)
              }
            };
          }
          return alb;
        })
      }
    }));
  };

  const updateSubnet = (albIndex, subnetIndex, value) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.map((alb, i) => {
          if (i === albIndex) {
            const newSubnets = [...alb.subnets.ids];
            newSubnets[subnetIndex] = value;
            return {
              ...alb,
              subnets: {
                ...alb.subnets,
                ids: newSubnets
              }
            };
          }
          return alb;
        })
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.namespace.trim()) {
      errors.namespace = t('errors.k8sNamespaceRequired');
    }
    
    if (formData.k8sType === 'aws') {
      if (!formData.awsConfig.region) errors.awsRegion = t('errors.awsRegionRequired');
      if (!formData.awsConfig.accessKey) errors.awsAccessKey = t('errors.awsAccessKeyRequired');
      // 不再强制要求Secret Key，因为我们不显示现有值
      // 只有在提供新值时才验证必填性
      if (formData.awsConfig.secretKey && formData.awsConfig.secretKey.trim() === '') {
        errors.awsSecretKey = t('errors.awsSecretKeyRequired');
      }
      if (!formData.clusterName) errors.awsClusterName = t('errors.awsClusterNameRequired');
      
      // 验证ALB配置
      if (formData.awsConfig.albs && formData.awsConfig.albs.length > 0) {
        formData.awsConfig.albs.forEach((alb, albIndex) => {
          if (!alb.name || alb.name.trim() === '') {
            errors[`albName_${albIndex}`] = t('errors.albNameRequired');
          }
          
          if (alb.certificateARNs && alb.certificateARNs.length > 0) {
            alb.certificateARNs.forEach((cert, certIndex) => {
              if (!cert || cert.trim() === '') {
                errors[`albCertificate_${albIndex}_${certIndex}`] = t('errors.certificateARNRequired');
              }
            });
          }
          
          if (alb.subnets && alb.subnets.ids && alb.subnets.ids.length > 0) {
            alb.subnets.ids.forEach((subnet, subnetIndex) => {
              if (!subnet || subnet.trim() === '') {
                errors[`albSubnet_${albIndex}_${subnetIndex}`] = t('errors.subnetIDRequired');
              }
            });
          }
        });
      }
    } else if (formData.k8sType === 'standard') {
      // 不再强制要求k8sConf，因为我们不显示现有值
      // 只有在提供新值时才验证必填性
      if (formData.k8sConf && formData.k8sConf.trim() === '') {
        errors.k8sConf = t('errors.k8sConfigRequired');
      }
    }
    
    if (formData.dockerRepositoryType === 'standard') {
      if (!formData.dockerRepositoryUrl.trim()) errors.dockerRepositoryUrl = t('errors.dockerUrlRequired');
      if (!formData.dockerRepositoryUsername.trim()) errors.dockerRepositoryUsername = t('errors.usernameRequired');
      if (!formData.dockerRepositoryPassword.trim()) errors.dockerRepositoryPassword = t('errors.passwordRequired');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      // 显示表单验证错误的toast
      setToast({
        message: t('errors.checkForm'),
        type: 'error'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch(
        `/api/projects/edit/${projectName}/${envName}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('errors.updateFailed'));
      }
      
      // 显示成功的toast
      setToast({
        message: t('projectEdit.updateSuccess'),
        type: 'success'
      });
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      // 显示错误的toast
      setToast({
        message: err.message,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">{t('projectEdit.loading')}</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>{t('projectEdit.title')}</h1>
        <p>{t('projectEdit.subtitle', { projectName, envName })}</p>
      </div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2>{t('projectForm.basicInfo')}</h2>
          <div className="form-group">
            <label>{t('projectForm.projectName')}</label>
            <input type="text" value={projectName} readOnly disabled />
          </div>
          <div className="form-group">
            <label>{t('projectForm.envName')}</label>
            <input type="text" value={envName} readOnly disabled />
          </div>
          
        </div>
        
        <div className="form-section">
          <h2>{t('projectForm.k8sConfig')}</h2>
          <div className="form-group">
            <label>{t('projectForm.k8sNamespace')}</label>
            <input
              type="text"
              name="namespace"
              value={formData.namespace}
              onChange={handleChange}
              placeholder={t('projectForm.k8sNamespacePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label>{t('projectForm.k8sType')}</label>
            <select
              name="k8sType"
              value={formData.k8sType}
              onChange={handleChange}
              disabled  // 不允许修改k8sType
            >
              <option value="standard">{t('projectForm.standardK8s')}</option>
              <option value="aws">AWS EKS</option>
            </select>
          </div>
          
          {formData.k8sType === 'standard' && (
            <div className="form-group">
              <label>{t('projectForm.k8sConfigContent')}</label>
              <textarea
                name="k8sConf"
                value={formData.k8sConf}
                onChange={handleChange}
                placeholder={t('projectForm.k8sConfigPlaceholder')}
                rows="10"
              />
              <small className="hint">{t('projectForm.k8sConfigHint')}</small>
            </div>
          )}
          
          {formData.k8sType === 'aws' && (
            <div className="form-group">
              <label>{t('projectForm.eksClusterName')}</label>
              <input
                type="text"
                value={formData.clusterName}
                readOnly  // clusterName设为只读，只能在创建时设置
                disabled
                placeholder={t('projectForm.clusterNameHint')}
              />
            </div>
          )}
        </div>
        
        {/* AWS配置：与Docker仓库配置同级 */}
        {(formData.k8sType === 'aws' || formData.dockerRepositoryType === 'aws') && (
          <div className="form-section">
            <h2>{t('projectForm.awsConfig')}</h2>
            <div className="form-group">
              <label>{t('projectForm.awsRegion')}</label>
              <input
                type="text"
                value={formData.awsConfig.region}
                onChange={(e) => handleAwsConfigChange('region', e.target.value)}
                placeholder={t('projectForm.awsRegionPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('projectForm.awsAccessKey')}</label>
              <input
                type="text"
                value={formData.awsConfig.accessKey}
                onChange={(e) => handleAwsConfigChange('accessKey', e.target.value)}
                placeholder={t('projectForm.awsAccessKeyPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('projectForm.awsSecretKey')}</label>
              <input
                type="password"
                value={formData.awsConfig.secretKey}
                onChange={(e) => handleAwsConfigChange('secretKey', e.target.value)}
                placeholder={t('projectForm.awsSecretKeyPlaceholder')}
              />
  </div>
            <small className="hint">{t('projectForm.awsSecretKeyHint')}</small>
          </div>
        )}     {/* ALB配置区域 */}
      {formData.k8sType === 'aws' && (
        <div className="form-section">
          <h2 id="albs-configuration">{t('projectForm.albs')}</h2>
          <button 
            type="button" 
            className="btn secondary small" 
            onClick={addAlb}
          >
            {t('projectForm.addAlb')}
          </button>
          
          {formData.awsConfig.albs.map((alb, albIndex) => (
            <div key={albIndex} className="alb-item">
              <div className="alb-header">
                <label>ALB {albIndex + 1}</label>
                <button 
                  type="button" 
                  className="btn danger small" 
                  onClick={() => removeAlb(albIndex)}
                  disabled={formData.awsConfig.albs.length <= 1}
                >
                  {t('projectForm.removeAlb')}
                </button>
              </div>
              
              {/* ALB名称 */}
              <div className="form-group">
                <label>{t('projectForm.albName')}</label>
                <input
                  type="text"
                  value={alb.name || ''}
                  onChange={(e) => updateAlb(albIndex, { ...alb, name: e.target.value })}
                  placeholder={t('projectForm.albNamePlaceholder')}
                />
              </div>
              
              {/* 证书配置 */}
              <div className="nested-group">
                <div className="nested-header">
                  <label>{t('projectForm.certificateARNs')}</label>
                  <button 
                    type="button" 
                    className="btn secondary small" 
                    onClick={() => addCertificate(albIndex)}
                  >
                    {t('projectForm.addCertificate')}
                  </button>
                </div>
                {alb.certificateARNs.map((cert, certIndex) => (
                  <div key={certIndex} className="nested-item">
                    <input
                      type="text"
                      value={cert || ''}
                      onChange={(e) => updateCertificate(albIndex, certIndex, e.target.value)}
                      placeholder={t('projectForm.certificateARNPlaceholder')}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn danger small" 
                      onClick={() => removeCertificate(albIndex, certIndex)}
                      disabled={alb.certificateARNs.length <= 1}
                    >
                      {t('projectForm.remove')}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* 子网配置 */}
              <div className="nested-group">
                <div className="nested-header">
                  <label>{t('projectForm.subnetIds')}</label>
                  <button 
                    type="button" 
                    className="btn secondary small" 
                    onClick={() => addSubnet(albIndex)}
                  >
                    {t('projectForm.addSubnet')}
                  </button>
                </div>
                {alb.subnets.ids.map((subnet, subnetIndex) => (
                  <div key={subnetIndex} className="nested-item">
                    <input
                      type="text"
                      value={subnet || ''}
                      onChange={(e) => updateSubnet(albIndex, subnetIndex, e.target.value)}
                      placeholder={t('projectForm.subnetIDPlaceholder')}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn danger small" 
                      onClick={() => removeSubnet(albIndex, subnetIndex)}
                      disabled={alb.subnets.ids.length <= 1}
                    >
                      {t('projectForm.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="form-section">
        <h2>{t('projectForm.dockerConfig')}</h2>
        <div className="form-group">
          <label>{t('projectForm.dockerRepositoryType')}</label>
          <select
            name="dockerRepositoryType"
            value={formData.dockerRepositoryType}
            onChange={handleChange}
          >
            <option value="standard">{t('projectForm.standardRepository')}</option>
            <option value="aws">AWS ECR</option>
          </select>
        </div>
        
        {formData.dockerRepositoryType === 'standard' && (
          <>
            <div className="form-group">
              <label>{t('projectForm.dockerUrl')}</label>
              <input
                type="text"
                name="dockerRepositoryUrl"
                value={formData.dockerRepositoryUrl}
                onChange={handleChange}
                placeholder={t('projectForm.dockerUrlPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('projectForm.username')}</label>
              <input
                type="text"
                name="dockerRepositoryUsername"
                value={formData.dockerRepositoryUsername}
                onChange={handleChange}
                placeholder={t('projectForm.usernamePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label>{t('projectForm.password')}</label>
              <input
                type="password"
                name="dockerRepositoryPassword"
                value={formData.dockerRepositoryPassword}
                onChange={handleChange}
                placeholder={t('projectForm.passwordPlaceholder')}
              />
            </div>
          </>
        )}
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={handleCancel}>
            {t('projectForm.cancel')}
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? t('projectForm.saving') : t('projectForm.saveChanges')}
          </button>
      </div>
      </form>
    </div>
  );
};

export default ProjectEdit;