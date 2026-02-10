import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/apiService';

const AppForm = () => {
  const { projectName, envName, appName: editAppName } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 安全提示样式
  const securityNoteStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '4px',
    padding: '8px 12px',
    marginBottom: '10px',
    fontSize: '0.9em',
    color: '#6c757d'
  };

  // 判断是否是编辑模式
  const isEditMode = !!editAppName;

  // 表单状态
  const [formData, setFormData] = useState({
    appName: '',
    gitUrl: '',
    gitBranch: 'main',
    resources: {
      requests: { cpu: '500m', memory: '500Mi' },
      limits: { cpu: '1000m', memory: '1000Mi' }
    },
    ports: [{ name: 'http', port: 1337 }],
    replicas: 1,
    useImagePullSecret: true,
    ingress: {
      type: 'default', // default,aws_alb
      host: '',
      service_port: 1337,
      tls: {
        cert: '',
        key: ''
      }
    },
    envsContent: '',
    hasIngress: false
  })
  const [albs, setAlbs] = useState([])
  const [selectedAlbDetails, setSelectedAlbDetails] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchAlbs = async () => {
    try {
      const response = await api.get(`/projects/detail/${projectName}/${envName}`);
      const detailedConfig = response.data;
      // 从配置中提取ALB信息
      if (detailedConfig.awsConfig && detailedConfig.awsConfig.albs) {
        setAlbs(detailedConfig.awsConfig.albs);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ALB data:', err);
    }
  }

  const fetchAppData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/apps/${projectName}/${envName}/detail/${editAppName}`);
      const data = response.data;

      setFormData({
        appName: data.appName,
        gitUrl: data.gitUrl || '',
        gitBranch: data.gitBranch || '',
        resources: data.resources || formData.resources,
        ports: data.ports || formData.ports,
        replicas: data.replicas || 1,
        useImagePullSecret: data.useImagePullSecret || false,
        ingress: data.ingress || formData.ingress,
        hasIngress: !!data.ingress
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching app data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 加载编辑数据
  useEffect(() => {
    fetchAlbs();
    if (isEditMode) {

      fetchAppData();
    }
  }, [isEditMode, projectName, envName, editAppName, t]);

  useEffect(() => {
    if (albs.length > 0) {
      if (formData.ingress.ingressClassName) {
        for (const alb of albs) {
          if (alb.name === formData.ingress.ingressClassName) {
            setSelectedAlbDetails(alb)
          }
        }
      }
    }
  }, [albs, formData])

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 处理嵌套对象属性
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 3) {
        const [parent1, parent2, child] = parts;
        // 对于ingress.tls相关的属性，保留原始字符串值
        if (parent1 === 'ingress' && parent2 === 'tls') {
          setFormData(prev => ({
            ...prev,
            [parent1]: {
              ...prev[parent1],
              [parent2]: {
                ...prev[parent1][parent2],
                [child]: value
              }
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [parent1]: {
              ...prev[parent1],
              [parent2]: {
                ...prev[parent1][parent2],
                [child]: parent1 === 'resources' ? value : parseInt(value) || 0
              }
            }
          }));
        }
      } else if (parts.length === 4) {
        const [parent1, parent2, parent3, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent1]: {
            ...prev[parent1],
            [parent2]: {
              ...prev[parent1][parent2],
              [parent3]: {
                ...prev[parent1][parent2][parent3],
                [child]: value
              }
            }
          }
        }));
      } else {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: parent === 'port' ? parseInt(value) || 0 : value
          }
        }));
      }
    } else if (name === 'replicas' || name === 'service_port') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // 清除对应的错误信息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  // 处理端口数组变化
  const handlePortChange = (index, field, value) => {
    const newPorts = [...formData.ports];
    if (field === 'port') {
      newPorts[index][field] = parseInt(value) || 0;
    } else {
      newPorts[index][field] = value;
    }
    setFormData(prev => ({ ...prev, ports: newPorts }));
  }

  // 添加端口
  const addPort = () => {
    setFormData(prev => ({
      ...prev,
      ports: [...prev.ports, { name: `port${prev.ports.length + 1}`, port: 1337 + prev.ports.length }]
    }));
  }

  // 删除端口
  const removePort = (index) => {
    if (formData.ports.length > 1) {
      const newPorts = formData.ports.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, ports: newPorts }));
    }
  }

  // 处理ingress开关
  const handleIngressToggle = () => {
    setFormData(prev => ({ ...prev, hasIngress: !prev.hasIngress }));
  }

  // 处理useImagePullSecret开关
  const handleImagePullSecretToggle = () => {
    setFormData(prev => ({ ...prev, useImagePullSecret: !prev.useImagePullSecret }));
  }

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    if (!formData.appName.trim()) {
      newErrors.appName = t('errors.requiredAppName');
    }

    // if (!formData.gitUrl.trim()) {
    //   newErrors.gitUrl = t('errors.requiredGitUrl');
    // }

    // if (!formData.gitBranch.trim()) {
    //   newErrors.gitBranch = t('errors.requiredGitBranch');
    // }

    // 验证资源配置
    if (!formData.resources.requests.cpu.trim()) {
      newErrors.resourcesRequestsCpu = t('errors.requiredCpuRequest');
    }
    if (!formData.resources.requests.memory.trim()) {
      newErrors.resourcesRequestsMemory = t('errors.requiredMemoryRequest');
    }
    if (!formData.resources.limits.cpu.trim()) {
      newErrors.resourcesLimitsCpu = t('errors.requiredCpuLimit');
    }
    if (!formData.resources.limits.memory.trim()) {
      newErrors.resourcesLimitsMemory = t('errors.requiredMemoryLimit');
    }

    // 验证端口配置
    formData.ports.forEach((port, index) => {
      if (!port.name.trim()) {
        newErrors[`port${index}Name`] = t('errors.requiredPortName', { index: index + 1 });
      }
      if (!port.port || port.port <= 0) {
        newErrors[`port${index}Port`] = t('errors.requiredPortValue', { index: index + 1 });
      }
    });

    // 验证副本数
    if (!formData.replicas || formData.replicas <= 0) {
      newErrors.replicas = t('errors.requiredReplicas');
    }

    // 验证ingress配置（如果启用）
    if (formData.hasIngress) {
      if (!formData.ingress.host.trim()) {
        newErrors.ingressHost = t('errors.requiredIngressHost');
      }
      if (!formData.ingress.service_port || formData.ingress.service_port <= 0) {
        newErrors.ingressServicePort = t('errors.requiredIngressServicePort');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      setError(t('errors.checkForm'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 准备提交数据
      const submitData = {
        appName: formData.appName,
        gitUrl: formData.gitUrl,
        gitBranch: formData.gitBranch,
        resources: formData.resources,
        ports: formData.ports,
        replicas: formData.replicas,
        useImagePullSecret: formData.useImagePullSecret,
        envsContent: formData.envsContent
      };

      // 如果启用了ingress，添加到提交数据中
      if (formData.hasIngress) {
        submitData.ingress = formData.ingress;
      }

      let response;
      if (isEditMode) {
        // 编辑模式
        response = await api.put(`/apps/${projectName}/${envName}/edit/${editAppName}`, submitData);
      } else {
        // 创建模式
        response = await api.post(`/apps/${projectName}/${envName}/create`, submitData);
      }

      const result = response.data;

      if (response.status === 200) {
        setSuccess(isEditMode ? t('appForm.updateSuccess') : t('appForm.createSuccess'));
        setTimeout(() => {
          navigate(`/apps/${projectName}/${envName}`);
        }, 1500);
      } else {
        throw new Error(result.error || (isEditMode ? t('errors.updateAppFailed') : t('errors.createAppFailed')));
      }
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    navigate(`/apps/${projectName}/${envName}`);
  }

  if (loading) {
    return <div className="container loading">{t('common.loading')}...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>{isEditMode ? t('appForm.editTitle') : t('appForm.createTitle')}</h1>
        <p>{t('appForm.description')}</p>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit} className="app-form">
        <div className="form-section">
          <h2>{t('appForm.basicInfo')}</h2>
          <div className="form-group">
            <label>{t('appForm.appName')}</label>
            <input
              type="text"
              name="appName"
              value={formData.appName}
              onChange={handleChange}
              placeholder={t('appForm.placeholderAppName')}
              disabled={isEditMode}
              className={errors.appName ? 'error-field' : ''}
            />
            {errors.appName && <div className="error">{errors.appName}</div>}
          </div>
          {/* <div className="form-group">
            <label>{t('appForm.gitUrl')}</label>
            <input
              type="text"
              name="gitUrl"
              value={formData.gitUrl}
              onChange={handleChange}
              placeholder={t('appForm.gitUrlPlaceholder')}
              className={errors.gitUrl ? 'error-field' : ''}
            />
            {errors.gitUrl && <div className="error">{errors.gitUrl}</div>}
          </div>
          <div className="form-group">
            <label>{t('appForm.gitBranch')}</label>
            <input
              type="text"
              name="gitBranch"
              value={formData.gitBranch}
              onChange={handleChange}
              placeholder={t('appForm.gitBranchPlaceholder')}
              className={errors.gitBranch ? 'error-field' : ''}
            />
            {errors.gitBranch && <div className="error">{errors.gitBranch}</div>}
          </div> */}
          <div className="form-group">
            <label>{t('appForm.replicas')}</label>
            <input
              type="number"
              name="replicas"
              value={formData.replicas}
              onChange={handleChange}
              min="1"
              className={errors.replicas ? 'error-field' : ''}
            />
            {errors.replicas && <div className="error">{errors.replicas}</div>}
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="imagePullSecretToggle"
                  checked={formData.useImagePullSecret}
                  onChange={handleImagePullSecretToggle}
                />
                <span className="toggle-slider"></span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {t('appForm.imagePullSecret')}
              </span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>{t('appForm.resources')}</h2>
          <div className="resources-grid">
            <div className="form-group">
              <label>{t('appForm.cpuRequest')}</label>
              <input
                type="text"
                value={formData.resources.requests.cpu}
                onChange={(e) => handleChange({ target: { name: 'resources.requests.cpu', value: e.target.value } })}
                placeholder="100m"
                className={errors.resourcesRequestsCpu ? 'error-field' : ''}
              />
              {errors.resourcesRequestsCpu && <div className="error">{errors.resourcesRequestsCpu}</div>}
            </div>
            <div className="form-group">
              <label>{t('appForm.memoryRequest')}</label>
              <input
                type="text"
                value={formData.resources.requests.memory}
                onChange={(e) => handleChange({ target: { name: 'resources.requests.memory', value: e.target.value } })}
                placeholder="100Mi"
                className={errors.resourcesRequestsMemory ? 'error-field' : ''}
              />
              {errors.resourcesRequestsMemory && <div className="error">{errors.resourcesRequestsMemory}</div>}
            </div>
            <div className="form-group">
              <label>{t('appForm.cpuLimit')}</label>
              <input
                type="text"
                value={formData.resources.limits.cpu}
                onChange={(e) => handleChange({ target: { name: 'resources.limits.cpu', value: e.target.value } })}
                placeholder="1000m"
                className={errors.resourcesLimitsCpu ? 'error-field' : ''}
              />
              {errors.resourcesLimitsCpu && <div className="error">{errors.resourcesLimitsCpu}</div>}
            </div>
            <div className="form-group">
              <label>{t('appForm.memoryLimit')}</label>
              <input
                type="text"
                value={formData.resources.limits.memory}
                onChange={(e) => handleChange({ target: { name: 'resources.limits.memory', value: e.target.value } })}
                placeholder="1000Mi"
                className={errors.resourcesLimitsMemory ? 'error-field' : ''}
              />
              {errors.resourcesLimitsMemory && <div className="error">{errors.resourcesLimitsMemory}</div>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>{t('appForm.ports')}</h2>
          {formData.ports.map((port, index) => (
            <div key={index} className="port-item">
              <div className="port-header">
                <h3>{t('appForm.port', { index: index + 1 })}</h3>
                {formData.ports.length > 1 && (
                  <button
                    type="button"
                    className="btn danger small"
                    onClick={() => removePort(index)}
                  >
                    {t('common.remove')}
                  </button>
                )}
              </div>
              <div className="port-fields">
                <div className="form-group">
                  <label>{t('appForm.portName')}</label>
                  <input
                    type="text"
                    value={port.name}
                    onChange={(e) => handlePortChange(index, 'name', e.target.value)}
                    placeholder="http"
                    className={errors[`port${index}Name`] ? 'error-field' : ''}
                  />
                  {errors[`port${index}Name`] && <div className="error">{errors[`port${index}Name`]}</div>}
                </div>
                <div className="form-group">
                  <label>{t('appForm.portNumber')}</label>
                  <input
                    type="number"
                    value={port.port}
                    onChange={(e) => handlePortChange(index, 'port', e.target.value)}
                    min="1"
                    max="65535"
                    className={errors[`port${index}Port`] ? 'error-field' : ''}
                  />
                  {errors[`port${index}Port`] && <div className="error">{errors[`port${index}Port`]}</div>}
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn secondary"
            onClick={addPort}
          >
            {t('appForm.addPort')}
          </button>
        </div>
        <div className="form-section">
          <h2>{t('appForm.envs')}</h2>
          <div className="form-group">
            <div className="security-note" style={securityNoteStyle}>
              {t('appForm.securityNote')}
            </div>
            <textarea
              value={formData.envsContent}
              onChange={(e) => handleChange({ target: { name: 'envsContent', value: e.target.value } })}
              placeholder="KEY=VALUE&#10;..."
              rows="10"
              style={{ width: '100%', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="ingressToggle"
                  checked={formData.hasIngress}
                  onChange={handleIngressToggle}
                />
                <span className="toggle-slider"></span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {t('appForm.enableIngress')}
              </span>
            </label>
          </div>

          {formData.hasIngress && (
            <div className="ingress-config">
              <h3>{t('appForm.ingress')}</h3>
              <div className="form-group">
                <label>{t('appForm.ingressHost')}</label>
                <input
                  type="text"
                  value={formData.ingress.host}
                  onChange={(e) => handleChange({ target: { name: 'ingress.host', value: e.target.value } })}
                  placeholder="example.com"
                  className={errors.ingressHost ? 'error-field' : ''}
                />
                {errors.ingressHost && <div className="error">{errors.ingressHost}</div>}
              </div>
              <div className="form-group">
                <label>{t('appForm.ingressServicePort')}</label>
                <input
                  type="number"
                  name="service_port"
                  value={formData.ingress.service_port}
                  onChange={(e) => handleChange({ target: { name: 'ingress.service_port', value: e.target.value } })}
                  min="1"
                  className={errors.ingressServicePort ? 'error-field' : ''}
                />
                {errors.ingressServicePort && <div className="error">{errors.ingressServicePort}</div>}
              </div>
              <div className="form-group">
                <label>{t('appForm.ingressType')}</label>
                <select
                  value={formData.ingress.type}
                  onChange={(e) => handleChange({ target: { name: 'ingress.type', value: e.target.value } })}
                >
                  <option value="default">{t('appForm.ingressTypes.default')}</option>
                  <option value="aws_alb">{t('appForm.ingressTypes.aws_alb')}</option>
                </select>
              </div>

              {formData.ingress.type === 'default' && (<div className="form-section">
                <h3>{t('appForm.tlsConfig')}</h3>
                <div className="security-note" style={securityNoteStyle}>
                  {t('appForm.securityNote')}
                </div>
                <div className="form-group">
                  <label>{t('appForm.certificateContent')}</label>
                  <textarea
                    value={formData.ingress.tls ? formData.ingress.tls.cert : ''}
                    onChange={(e) => handleChange({ target: { name: 'ingress.tls.cert', value: e.target.value } })}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    rows="10"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
                <div className="form-group">
                  <label>{t('appForm.privateKeyContent')}</label>
                  <textarea
                    value={formData.ingress.tls ? formData.ingress.tls.key : ''}
                    onChange={(e) => handleChange({ target: { name: 'ingress.tls.key', value: e.target.value } })}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    rows="10"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
              </div>)}
              {formData.ingress.type === 'aws_alb' && (
                <div className="form-group">
                  <label>{t('appForm.selectAlb')}</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={formData.ingress.ingressClassName || ''}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        handleChange({ target: { name: 'ingress.ingressClassName', value: selectedName } });
                        // 当选择ALB时，找到对应的ALB对象并存储其详细信息
                        if (selectedName) {
                          const selectedAlb = albs.find(alb => alb.name === selectedName);
                          setSelectedAlbDetails(selectedAlb || null);
                        } else {
                          setSelectedAlbDetails(null);
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      <option value="">{t('appForm.placeholderSelectAlb')}</option>
                      {albs?.map(alb => (
                        <option key={alb.name} value={alb.name}>{alb.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={fetchAlbs}
                      title={t('appForm.refreshAlbs')}
                    >
                      {t('appForm.refresh')}
                    </button>
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => {
                        window.open(`/edit/${projectName}/${envName}#albs-configuration`, '_blank');
                      }}
                    >
                      {t('appForm.createAlb')}
                    </button>
                  </div>

                  {/* 显示选中ALB的详细参数 */}
                  {selectedAlbDetails && (
                    <div className="alb-details" style={{
                      marginTop: '16px',
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#f9f9f9',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <h4 style={{
                        margin: '0 0 16px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#333',
                        borderBottom: '1px solid #e0e0e0',
                        paddingBottom: '8px'
                      }}>{t('appForm.albDetails')}</h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr',
                        gap: '12px',
                        fontSize: '14px'
                      }}>
                        {Object.entries(selectedAlbDetails).map(([key, value]) => {
                          // 格式化键名，让它更易读
                          const formattedKey = key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                          // 改进对象类型值的显示
                          const displayValue = typeof value === 'object' && value !== null
                            ? Array.isArray(value)
                              ? (
                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                  {value.map((item, index) => (
                                    <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                                  {Object.entries(value).map(([subKey, subValue]) => (
                                    <div key={subKey} style={{ marginBottom: '4px' }}>
                                      <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>{subKey}:</span>
                                      <span style={{ fontSize: '12px' }}> {typeof subValue === 'object' ? JSON.stringify(subValue) : subValue}</span>
                                    </div>
                                  ))}
                                </div>
                              )
                            : value;

                          return (
                            <React.Fragment key={key}>
                              <div style={{
                                fontWeight: 'bold',
                                color: '#555',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                {formattedKey}:
                              </div>
                              <div style={{
                                color: '#333',
                                wordBreak: 'break-word',
                                whiteSpace: typeof value === 'object' ? 'normal' : 'pre-wrap'
                              }}>
                                {displayValue}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>)}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={handleCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? (
              isEditMode ? t('common.updating') + '...' : t('common.creating') + '...'
            ) : (
              isEditMode ? t('appForm.updateApp') : t('appForm.createApp')
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AppForm;