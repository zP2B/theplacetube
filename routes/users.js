const express = require('express');
const router = express.Router();
const auth_controller = require('../controllers/authController');
const profile_controller = require('../controllers/profileController');

router.get('/profile/:username', profile_controller.user_view_get);
router.get('/profile/:username/edit', profile_controller.user_edit_get);
router.post('/profile/:username/edit', profile_controller.user_edit_post);
router.get('/profile', profile_controller.user_profile_get);
router.get('/login', auth_controller.user_login_get);
router.post('/login', auth_controller.user_login_post);
router.get('/logout', auth_controller.user_logout_get);
router.get('/join', auth_controller.user_join_get);
router.post('/join', auth_controller.user_join_post);

module.exports = router;