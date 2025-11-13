const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const { execSync } = require('child_process');

exports.genImagePullSecret = function genImagePullSecret(dirpath, config, appName) {
  if (config.docker_repository.type == 'standard') {
    genStandardImagePullSecret(dirpath, config, appName);
  } else if (config.docker_repository.type == 'aws') {
    genAwsImagePullSecret(dirpath, config, appName);
  }
}


function genStandardImagePullSecret(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
  const secretName = appConfig.imagePullSecret;

  if (!secretName) {
    return;
  }
  if (!config.docker_repository) {
    throw new Error('Invalid docker_repository configure configuration!');
  }
  const { username, password, url } = config.docker_repository;
  if (!username || !password || !url) {
    throw new Error('Invalid docker_repository configure configuration!');
  }
  execSync(`echo "${password}" | docker login ${url} --username ${username} --password-stdin`);

  const dockerConfig = { "auths": {} };
  dockerConfig["auths"][url] = { username, password };
  const dockerConfigJson = JSON.stringify(dockerConfig);

  const secret = {
    apiVersion: "v1",
    type: "kubernetes.io/dockerconfigjson",
    kind: "Secret",
    metadata: {
      name: secretName,
      namespace,
    },
    data: {
      ".dockerconfigjson": Buffer.from(dockerConfigJson).toString('base64')
    }
  }
  fs.writeFileSync(path.join(dirpath, 'ymls', secretName + '-secret.yml'), YAML.stringify(secret));
}

function genAwsImagePullSecret(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;
  const secretName = appConfig.imagePullSecret;

  if (!secretName) {
    return;
  }
  if (!config.aws || !config.aws.accessKey || !config.aws.secretKey || !config.aws.region || !config.docker_repository.url) {
    throw new Error('Invalid aws configuration!');
  }

  const shell = `aws configure set aws_access_key_id ${config.aws.accessKey};`
    + `aws configure set aws_secret_access_key ${config.aws.secretKey};`
    + `aws ecr get-login-password --region ${config.aws.region}`;
  try {
    const output = execSync(shell);
    const password = output && output.toString();
    execSync(`echo "${password}" | docker login ${config.docker_repository.url} --username AWS --password-stdin`);
    
    const dockerConfig = { "auths": {} };
    dockerConfig["auths"][config.docker_repository.url] = { username: "AWS", password };
    const dockerConfigJson = JSON.stringify(dockerConfig);

    const secret = {
      apiVersion: "v1",
      type: "kubernetes.io/dockerconfigjson",
      kind: "Secret",
      metadata: {
        name: secretName,
        namespace,
      },
      data: {
        ".dockerconfigjson": Buffer.from(dockerConfigJson).toString('base64')
      }
    }
    fs.writeFileSync(path.join(dirpath, 'ymls', secretName + '-secret.yml'), YAML.stringify(secret));

  } catch (error) {
    console.error(`Execute shell error: ${error}`);
  }
}