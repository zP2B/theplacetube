const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

require('../models/video');
const Video = mongoose.model('Video');

/* GET home page. */
router.get('/', (req, res, next) => {
  Video
      .find()
      .sort({'date': -1})
      .limit(50)
      .exec((err, videos) => {
        if (err) {
          next(err);
          return;
        }
        res.render('index', {
          title: 'the place to be',
          videos: videos,
        });
      });
});

module.exports = router;