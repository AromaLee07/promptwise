// src/api/routes/userRoutes.js
const multer = require('multer');


const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = multer({ dest: 'uploads/' });


router.post('/register', userController.register);
router.get('/email/:email', userController.findUserByEmail);
router.post('/user/:userId/avatar', upload.single('avatar'), userController.uploadAvatar);

// router.post('/users/:userId/login', userController.login);
router.get('/user/:userId/click', userController.click);

// Google login route
router.post('/login', userController.login);

// logout route
router.get('/logout', userController.logout);

// api
// router.post('/generate', apiController.generate);

// Google callback route
// router.get('/callback', authController.callback);







module.exports = router;
