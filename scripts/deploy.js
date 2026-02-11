const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const { genDeployment } = require('./gen_deployment');
const { genService } = require('./gen_service');
const { genEnvSecret } = require('./gen_env_secret');
const { genImagePullSecret } = require('./gen_image_pull_secret');
const { genIngress } = require('./gen_ingress');
const { genKubeConfig } = require('./gen_kubeconf');
const { sendTextMsg } = require('./feishu_send');

exports.deploy = function deploy(projectName, env, appName, imageTag, sourceCodePath, feishuRobotId, feishuSecret) {
    const dirpath = path.join(__dirname, '../projects', projectName, env);
    const config = require(dirpath + '/config.json');
    const image = `${config.docker_repository.url}/${appName}:${imageTag}`;

    try {
        // build
        if (fs.existsSync(sourceCodePath + '/build.sh')) {
            const output = execSync(`cd ${sourceCodePath}; sh build.sh`);
            console.log(output && output.toString());
        }
        genImagePullSecret(dirpath, config, appName);
        sendTextMsg(`Start building ${projectName} ${env} ${appName} ${imageTag} (${new Date().toLocaleString()})`, feishuRobotId, feishuSecret);
        const output = execSync(`docker build -t ${image} ${sourceCodePath}`);
        console.log(output && output.toString());
        const output1 = execSync(`docker push ${image}`);
        console.log(output1 && output1.toString());

        // deploy
        sendTextMsg(`Start deploying ${projectName} ${env} ${appName} ${imageTag} (${new Date().toLocaleString()})`, feishuRobotId, feishuSecret);
        genKubeConfig(dirpath, config);
        createNamespace(dirpath, config);
        genDeployment(dirpath, config, appName, image);
        //genService(dirpath, config, appName);
        genEnvSecret(dirpath, config, appName);
        genIngress(dirpath, config, appName);

        const output2 = execSync(`kubectl --kubeconfig="${dirpath}/kube_conf.yml" apply -f ${dirpath}/ymls/`);
        console.log(output2 && output2.toString());
        const output3 = execSync(`kubectl --kubeconfig="${dirpath}/kube_conf.yml" apply -f ${dirpath}/ymls/${appName}/`);
        console.log(output3 && output3.toString());
        // finish
        sendTextMsg(`Deployed ${projectName} ${env} ${appName} ${imageTag} K8s result: ${output3 && output3.toString()} (${new Date().toLocaleString()})`, feishuRobotId, feishuSecret);
    } catch (error) {
        sendTextMsg(`Deploy ${projectName} ${env} ${appName} ${imageTag} failed: ${error} (${new Date().toLocaleString()})`, feishuRobotId, feishuSecret);
        console.error(`Execute shell error: ${error}`);
    }
}

function createNamespace(dirpath, config) {
    try {
        const kubeConfigPath = path.join(dirpath, 'kube_conf.yml');
        const output = execSync(`kubectl --kubeconfig="${kubeConfigPath}" get ns | grep ${config.namespace}`);
        if (output && output.toString().includes(config.namespace)) {
            // 命名空间已存在, 继续执行
            return;
        }
        execSync(`kubectl --kubeconfig="${kubeConfigPath}" create namespace ${config.namespace}`);
    } catch (error) {
        const errMsg = error.stderr && Buffer.from(error.stderr)
        if (errMsg && errMsg.includes('exists')) {
            // 命名空间已存在, 继续执行
        } else {
            console.error('Namespace creation error:', error);
        }
    }
}