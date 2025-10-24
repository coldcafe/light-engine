const path = require('path');
const fs = require('fs');
const env2secret = require('./env2secret');

exports.genEnvSecret = function genEnvSecret(dirpath, config, appName) {
  const appConfig = config.app[appName];
  const namespace = config.namespace;

  const envStr = fs.readFileSync(path.join(dirpath, 'envs',appConfig.envSecret + '.env'), 'utf-8');
  const envSecret = env2secret.run(namespace, appConfig.envSecret, envStr);

  fs.writeFileSync(path.join(dirpath, 'ymls', appConfig.envSecret + '-env.yml'), envSecret);
}