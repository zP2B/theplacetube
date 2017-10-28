'use strict';

const express = require('express');
const router = express.Router();
const explorer = require('../controllers/explorer');

/* GET home page. */
router.get('/', explorer.index);
router.get('/videos.json', explorer.xhrFetchVideos);

module.exports = router;