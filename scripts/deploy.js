const path = require('path');
const { execSync } = require('child_process');

const { genDeployment } = require('./gen_deployment');
const { genService } = require('./gen_service');
const { genEnvSecret } = require('./gen_env_secret');
const { genImagePullSecret } = require('./gen_image_pull_secret');
const { genIngress } = require('./gen_ingress');
const { genKubeConfig } = require('./gen_kubeconf');

exports.deploy = function deploy(projectName, env, appName, imageTag, sourceCodePath) {
    const dirpath = path.join(__dirname, '../projects', projectName, env);
    const config = require(dirpath + '/config.json');
    const image = `${config.docker_repository.url}/${projectName}/${appName}:${imageTag}`;

    genKubeConfig(dirpath, config);
    createNamespace(dirpath, config);
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
}

function createNamespace(dirpath, config) {
    try {
        const kubeConfigPath = path.join(dirpath, 'kube_conf.yml');
        execSync(`kubectl --insecure-skip-tls-verify --kubeconfig="${kubeConfigPath}" create namespace ${config.namespace}`);
    } catch (error) {
        const errMsg = error.stderr && Buffer.from(error.stderr)
        if (errMsg && errMsg.includes('exists')) {
            // 命名空间已存在, 继续执行
        } else {
            console.error('Namespace creation error:', error);
            return res.status(500).json({ error: 'Failed to create namespace.' + errMsg });
        }
    }
}