const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const env2secret = require('./env2secret');

exports.genDeployment = function genDeployment(dirpath, config, appName, image) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;

  const deployment = {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "namespace": namespace,
      "name": appName
    },
    "spec": {
      "replicas": appConfig.replicas,
      "selector": { "matchLabels": { "app": appName } }
    }
  };
  deployment.spec.template = {
    "metadata": {
      "labels": { "app": appName, "name": appName }
    },
    "spec": getSpec(dirpath, appName, config, appConfig, image)
  };
  if (!fs.existsSync(path.join(dirpath, 'ymls', appName))) {
    fs.mkdirSync(path.join(dirpath, 'ymls', appName), { recursive: true });
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName, "deployment.yml"), YAML.stringify(deployment))
} 

function getSpec(dirpath, appName, config, appConfig, image) {
  const sepc = {
    containers: getContainers(dirpath, appName, config, appConfig, image)
  }
  if (appConfig.imagePullSecret) {
    sepc.imagePullSecrets = [
      {
        name: appConfig.imagePullSecret
      }
    ];
  }
  return sepc;
}
function getContainers(dirpath, appName, config, appConfig, image) {
  
  const envs = [];
  if (appConfig.envs) {
    for (let key of Object.keys(appConfig.envs)) {
      envs.push({ name: key, value: appConfig.envs[key] })
    }
  }
  if (appConfig.alicloudSlsEnabled && config.aliyun && config.aliyun.alicloudSlsProject) {
    envs.push(
      { name: "aliyun_logs_" + config.name + "-" + appName + "-" + config.env, value: "stdout" },
      { name: "aliyun_logs_" + config.name + "-" + appName + "-" + config.env + "_logstore", value: appName },
      { name: "aliyun_logs_" + config.name + "-" + appName + "-" + config.env + "_project", value: config.aliyun.alicloudSlsProject },
    )
  }

  if (appConfig.envSecret) {
    const envStr = fs.readFileSync(path.join(dirpath, 'envs',appConfig.envSecret + '.env'), 'utf-8')
    const envKeys = env2secret.getEnvKeys(envStr)
    for (let key of envKeys) {
      if (envs.findIndex(i => i.name == key) == -1) {
        envs.push({
          name: key,
          valueFrom: {
            secretKeyRef: { name: appConfig.envSecret, key: key }
          }
        })
      }
    }
  }
  const container = {
    "name": appName,
    "image": image,
    "imagePullPolicy": "Always",
    "resources": appConfig.resources,
    "lifecycle": {
      "preStop": {
        "exec": {
          "command": ["sleep", "30"]
        }
      }
    }
  }
  if (envs.length > 0) {
    container.env = envs
  }
  if (appConfig.ports && appConfig.ports.length > 0) {
    container.ports = appConfig.ports.map(port => ({ containerPort: port.port }))
  }
  return [container]
}