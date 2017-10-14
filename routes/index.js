const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');

require('../models/video');
const Video = mongoose.model('Video');

/* GET home page. */
router.get('/', (req, res, next) => {
  let country;
  const geo = geoip.lookup(req.ip);
  if (geo) {
    country = countries.getName(geo.country, 'en');
  }
  Video
      .find()
      .sort({'date': -1})
      .limit(50)
      .exec((err, videos) => {
        if (err) {
          next(err);
          return;
        }
        return res.render('index', {
          title: 'the place to be',
          videos: videos,
          country: country,
        });
      });
});

module.exports = router;