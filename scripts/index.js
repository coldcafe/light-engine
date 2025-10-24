const path = require('path');
const { execSync } = require('child_process');

const { genDeployment } = require('./gen_deployment');
const { genService } = require('./gen_service');
const { genEnvSecret } = require('./gen_env_secret');
const { genImagePullSecret } = require('./gen_image_pull_secret');
const { genIngress } = require('./gen_ingress');

const [projectName, env, appName, imageTag, sourceCodePath] = process.argv.splice(2);

const dirpath = path.join(__dirname, '../k8s_yml', projectName, env);
const config = require(dirpath + '/config.json');

const image = `${config.docker_repository.url}/${projectName}/${appName}:${imageTag}`;

genDeployment(dirpath, config, appName, image);
genService(dirpath, config, appName);
genEnvSecret(dirpath, config, appName);
genImagePullSecret(dirpath, config, appName);
genIngress(dirpath, config, appName);

try {
  const output = execSync(`docker build -t ${image} ${sourceCodePath}`);
  console.log(output && output.toString());
  const output1 = execSync(`docker push ${image}`);
  console.log(output1 && output1.toString());
  const output2 = execSync(`kubectl --kubeconfig="${dirpath}/kube_conf.yml" apply -f "${dirpath}/ymls"`);
  console.log(output2 && output2.toString());
} catch (error) {
  console.error(`Execute shell error: ${error}`);
}