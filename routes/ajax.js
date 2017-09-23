const express = require('express');
const router = express.Router();
const ajaxController = require('../controllers/ajaxController');

/* GET home page. */
router.get('/youtube/details/:id', ajaxController.get_youtube_details);
router.get('/youtube/search', ajaxController.get_youtube_search);
router.get('/place', ajaxController.get_place_tubes);
router.get('/bounds', ajaxController.get_bounds_tubes);
router.get('/youtube/area', ajaxController.get_youtube_top);

module.exports = router;