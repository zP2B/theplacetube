const express = require('express');
const multer = require('multer');
const upload = multer({dest: 'public/uploads/'});
const router = express.Router();
const auth_controller = require('../controllers/auth-controller');
const profile_controller = require('../controllers/profile-controller');

router.get('/profile/:username', profile_controller.user_view_get);
router.get('/profile/:username/edit', profile_controller.user_edit_get);
router.post('/profile/:username/edit', upload.single('avatar'), profile_controller.user_edit_post);
router.get('/profile', profile_controller.user_profile_get);
router.get('/login', auth_controller.user_login_get);
router.post('/login', auth_controller.user_login_post);
router.get('/logout', auth_controller.user_logout_get);
router.get('/join', auth_controller.user_join_get);
router.post('/join', auth_controller.user_join_post);
router.get('/join/success', auth_controller.user_join_success);

module.exports = router;