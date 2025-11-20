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
    "spec": getSpec(dirpath, appName, appConfig, image)
  };
  if (!fs.existsSync(path.join(dirpath, 'ymls'))) {
    fs.mkdirSync(path.join(dirpath, 'ymls'), { recursive: true });
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName + "-deployment.yml"), YAML.stringify(deployment))
}

function getSpec(dirpath, appName, appConfig, image) {
  const sepc = {
    containers: getContainers(dirpath, appName, appConfig, image)
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
function getContainers(dirpath, appName, appConfig, image) {
  const envStr = fs.readFileSync(path.join(dirpath, 'envs',appConfig.envSecret + '.env'), 'utf-8')
  const envKeys = env2secret.getEnvKeys(envStr)
  const envs = [];
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
  return [
    {
      "name": appName,
      "image": image,
      "imagePullPolicy": "Always",
      "ports": appConfig.ports.map(port => ({ containerPort: port.port })),
      "resources": appConfig.resources,
      "lifecycle": {
        "preStop": {
          "exec": {
            "command": ["sleep", "30"]
          }
        }
      },
      "env": envs
    }
  ]
}