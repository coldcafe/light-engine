const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/create', projectController.createProject);
router.get('/list', projectController.listProjects);
router.get('/detail/:projectName/:envName', projectController.getProjectDetail);
router.put('/edit/:projectName/:envName', projectController.editProject);

module.exports = router;