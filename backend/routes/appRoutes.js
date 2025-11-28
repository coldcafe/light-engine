const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const { authMiddleware } = require('../auth/jwtUtils');

// 创建app
router.post('/:projectName/:envName/create', authMiddleware, appController.createApp);
// 列出项目中的所有app
router.get('/:projectName/:envName/list', authMiddleware, appController.listApps);
// 获取单个app详情
router.get('/:projectName/:envName/detail/:appName', authMiddleware, appController.getAppDetail);
// 编辑app
router.put('/:projectName/:envName/edit/:appName', authMiddleware, appController.editApp);
// 删除app
router.delete('/:projectName/:envName/delete/:appName', authMiddleware, appController.deleteApp);
// 部署app
router.post('/:projectName/:envName/deploy/:appName', authMiddleware, appController.deployApp);

module.exports = router;