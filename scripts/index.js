const { deploy } = require('./deploy');

const [projectName, env, appName, imageTag, sourceCodePath] = process.argv.splice(2);

deploy(projectName, env, appName, imageTag, sourceCodePath);