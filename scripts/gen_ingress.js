const path = require('path');
const fs = require('fs');
const YAML = require('yaml');

exports.genIngress = function genIngress(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
  if (!appConfig.ingress) {
    return;
  }
  const host = appConfig.ingress.host;
  const servicePort = appConfig.ingress.service_port;
  const ingress = {
    "apiVersion": "networking.k8s.io/v1",
    "kind": "Ingress",
    "metadata": {
      "name": appName,
      "namespace": namespace
    },
    "spec": {
      "rules": [
        {
          "host": host,
          "http": {
            "paths": [
              {
                "path": "/",
                "pathType": "Prefix",
                "backend": {
                  "service": {
                    "name": appName,
                    "port": {
                      "number": servicePort
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  };
  if (appConfig.ingress.type == 'default' && appConfig.ingress.tls) {
    genTlsSecret(dirpath, config, appName);
    ingress.spec["tls"] = [
      {
        "hosts": [host],
        "secretName": appName + "-tls"
      }
    ];
  } else if (appConfig.ingress.type == 'aws_alb') {
    genAwsALbIngressClass(dirpath, config)
    ingress.spec["ingressClassName"] = appConfig.ingress.ingressClassName;
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName, "ingress.yml"), YAML.stringify(ingress))
}

function genTlsSecret(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
  const cert = fs.readFileSync(path.join(dirpath, appConfig.ingress.tls.cert), 'base64');
  const key = fs.readFileSync(path.join(dirpath, appConfig.ingress.tls.key), 'base64');
  const tlsSecret = {
    "apiVersion": "v1",
    "kind": "Secret",
    "type": "kubernetes.io/tls",
    "metadata": {
      "name": appName + "-tls",
      "namespace": namespace
    },
    "data": {
      "tls.crt": cert,
      "tls.key": key
    }
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', appName, "tls.yml"), YAML.stringify(tlsSecret))
}

function genAwsALbIngressClass(dirpath, config) {
  const namespace = config.namespace;
  const awsConfig = config.aws;
  for (const albConfig of awsConfig.albs) {
    const ingressClassParams = {
      "apiVersion": "eks.amazonaws.com/v1",
      "kind": "IngressClassParams",
      "metadata": {
        "name": albConfig.name,
        "namespace": namespace
      },
      "spec": {
        "scheme": "internet-facing",
        "certificateARNs": albConfig.certificateARNs,
        "subnets": albConfig.subnets
      }
    }
    fs.writeFileSync(path.join(dirpath, 'ymls', albConfig.name + "-ingressClassParams.yml"), YAML.stringify(ingressClassParams))
    const ingressClass = {
      "apiVersion": "networking.k8s.io/v1",
      "kind": "IngressClass",
      "metadata": {
        "name": albConfig.name,
        "namespace": namespace
      },
      "spec": {
        "controller": "eks.amazonaws.com/alb",
        "parameters": {
          "apiGroup": "eks.amazonaws.com",
          "kind": "IngressClassParams",
          "name": albConfig.name,
        }
      }
    }
    fs.writeFileSync(path.join(dirpath, 'ymls', albConfig.name + "-ingressClass.yml"), YAML.stringify(ingressClass))
  }
}