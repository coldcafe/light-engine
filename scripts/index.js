const fs = require('fs');
const { deploy } = require('./deploy');

const [projectName, env, appName, imageTag, sourceCodePath, feishuRobotId, feishuSecret] = process.argv.splice(2);

if (!fs.existsSync(sourceCodePath)) {
    console.error(`Source code path ${sourceCodePath} does not exist.`);
    process.exit(1);
}
if (!fs.existsSync(sourceCodePath + '/Dockerfile')) {
    console.error(`Dockerfile not found in source code path ${sourceCodePath}.`);
    process.exit(1);
}

deploy(projectName, env, appName, imageTag, sourceCodePath, feishuRobotId, feishuSecret);