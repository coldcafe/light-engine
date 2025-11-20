const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

exports.genKubeConfig = function genKubeConfig(dirpath, config) {
    const kubeConfigPath = path.join(dirpath, 'kube_conf.yml');
    if (fs.existsSync(kubeConfigPath)) {
        return;
    }
    if (config.k8sType === 'aws') {
        const shell = `aws configure set aws_access_key_id ${config.aws.accessKey};`
            + `aws configure set aws_secret_access_key ${config.aws.secretKey};`
            + `aws eks update-kubeconfig --kubeconfig="${kubeConfigPath}" --region ${config.aws.region} --name ${config.clusterName};`;
        execSync(shell);
    }
}