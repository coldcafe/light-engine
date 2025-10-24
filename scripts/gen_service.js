const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

exports.genService = function genService(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
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
      "ports": appConfig.ports.map(port => (
        {
          "name": port.name,
          "port": port.port,
          "targetPort": port.port
        }
      )),
      "selector": {
        "name": appName
      },
      "type": "ClusterIP"
    }
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName + "-service.yml"), YAML.stringify(service))
}