const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// 创建app
router.post('/:projectName/:envName/create', appController.createApp);
// 列出项目中的所有app
router.get('/:projectName/:envName/list', appController.listApps);
// 获取单个app详情
router.get('/:projectName/:envName/detail/:appName', appController.getAppDetail);
// 编辑app
router.put('/:projectName/:envName/edit/:appName', appController.editApp);
// 删除app
router.delete('/:projectName/:envName/delete/:appName', appController.deleteApp);
// 部署app
router.post('/:projectName/:envName/deploy/:appName', appController.deployApp);

module.exports = router;