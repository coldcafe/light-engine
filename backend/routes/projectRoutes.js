const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware } = require('../auth/jwtUtils');

router.post('/create', authMiddleware, projectController.createProject);
router.get('/list', authMiddleware, projectController.listProjects);
router.get('/detail/:projectName/:envName', authMiddleware, projectController.getProjectDetail);
router.put('/edit/:projectName/:envName', authMiddleware, projectController.editProject);

module.exports = router;