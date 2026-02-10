const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

exports.genService = function genService(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
  if (!appConfig.ports || appConfig.ports.length === 0) {
    return;
  }
  const service = {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "labels": {
        "name": appName
      },
      "name": appName,
      "namespace": namespace
    },
    "spec": {
      "ports": appConfig.ports ?appConfig.ports.map(port => (
        {
          "name": port.name,
          "port": port.port,
          "targetPort": port.targetPort || port.port
        }
      )) : [],
      "selector": {
        "name": appName
      },
      "type": "ClusterIP"
    }
  }
  
  if (appConfig.aliyun && appConfig.aliyun.lbCertId) {
    service.spec.type = "LoadBalancer";
    service.spec.ports = [
      {
        "name": "https",
        "port": 443,
        "targetPort": appConfig.aliyun.targetPort || 1337
      },
      {
        "name": "http",
        "port": 80,
        "targetPort": appConfig.aliyun.targetPort || 1337
      }
    ];
    service.metadata.annotations = {
      "service.beta.kubernetes.io/alibaba-cloud-loadbalancer-protocol-port": "https:443,http:80",
      "service.beta.kubernetes.io/alibaba-cloud-loadbalancer-forward-port": "80:443",
      "service.beta.kubernetes.io/alibaba-cloud-loadbalancer-cert-id": appConfig.aliyun.lbCertId,
      "service.beta.kubernetes.io/alibaba-cloud-loadbalancer-instance-charge-type": "PayByCLCU"
    }
    if (appConfig.aliyun.lbId) {
      service.metadata.annotations["service.beta.kubernetes.io/alibaba-cloud-loadbalancer-id"] = appConfig.aliyun.lbId
      service.metadata.annotations["service.beta.kubernetes.io/alibaba-cloud-loadbalancer-force-override-listeners"] = "true"
    }
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName, "service.yml"), YAML.stringify(service))
}