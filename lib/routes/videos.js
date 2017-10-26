const express = require('express');
const router = express.Router();
const video_controller = require('../controllers/video-controller');

router.get('/add', video_controller.video_add_get);
router.post('/add', video_controller.video_add_post);
router.get('/delete/:videoId', video_controller.video_delete_get);
router.get('/edit/:videoId', video_controller.video_edit_get);
router.post('/edit/:videoId', video_controller.video_edit_post);
router.get('/:videoId', video_controller.video_view_get);

module.exports = router;