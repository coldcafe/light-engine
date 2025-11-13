const { input, editor, select } = require('@inquirer/prompts');
const fs = require('fs');
const { execSync } = require('child_process');

async function createProject() {
  const projectName = await input({ message: 'Enter project name: ' });
  const envName = await input({ message: 'Enter env name: ', default: 'prod' });
  const dirPath = path.join(__dirname, '../k8s_yml', projectName, envName)
  fs.mkdirSync(dirPath, {recursive: true});

  const config = {};

  const k8sType = await select({
    message: 'Select K8S type : ',
    choices: [
      {
        name: 'Standard',
        value: 'standard',
      },
      {
        name: 'Amazon EKS',
        value: 'aws',
      }
    ],
  });
  if (k8sType === 'standard') {
    const k8sConf = await editor({ message: 'Create kube_conf.yml: ' });
    fs.writeFileSync(path.join(dirPath, "kube_conf.yml"), k8sConf);
  } else if (k8sType === 'aws') {
    const region = await input({ message: 'Enter AWS region: ', default: 'us-east-1' });
    const accessKey = await input({ message: 'Enter AWS accessKey: ' });
    const secretKey = await input({ message: 'Enter AWS secretKey: ' });
    const clusterName = await input({ message: 'Enter Amazon EKS cluster name: ' });
    config["aws"] = { region, accessKey, secretKey };
    const shell = `aws configure set aws_access_key_id ${config.aws.accessKey};`
    + `aws configure set aws_secret_access_key ${config.aws.secretKey};`
    + `aws eks update-kubeconfig --kubeconfig="${path.join(dirPath, 'kube_conf.yml')}"  --region ${region} --name ${clusterName};`
    execSync(shell);
  } else {
  }
  const namespace = await input({ message: 'Create K8S namespace: ' });
  execSync(`kubectl --kubeconfig="${path.join(dirPath, 'kube_conf.yml')}" create namespace ${namespace}`);
  const dockerRepositoryType = await select({
    message: 'Select docker repository type : ',
    choices: [
      {
        name: 'Standard',
        value: 'standard',
      },
      {
        name: 'Amazon ECR',
        value: 'aws',
      }
    ],
  });
  const dockerRepositoryUrl = await input({ message: 'Enter docker repository url: ' });
  config['docker_repository'] = {
    type: dockerRepositoryType,
    url: dockerRepositoryUrl
  }
  if (dockerRepositoryType == 'standard') {
    const dockerRepositoryUsername = await input({ message: 'Enter docker repository username: ' });
    const dockerRepositoryPassword = await input({ message: 'Enter docker repository password: ' });
    config['docker_repository']['username'] = dockerRepositoryUsername;
    config['docker_repository']['password'] = dockerRepositoryPassword;
  }
  
}
createProject().catch(err => console.error(err))