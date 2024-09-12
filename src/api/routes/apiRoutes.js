const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');


// api
router.post('/generate', apiController.generate);
// router.post('/generate/song', apiController.generateSong);

// 处理Google登录的路由
router.get('/auth/google', apiController.googleLogin);

// 处理Google登录回调的路由
router.get('/auth/google/callback', apiController.googleCallback);

router.get('/google-login', apiController.googleLogin1);

router.post('/get-cookie',apiController.getCookie)

module.exports = router;