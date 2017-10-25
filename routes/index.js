const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');
const googlemaps = require('../services/google-maps');
const geolib = require('../services/geolib');
const youtubesearch = require('../services/youtube-search');
const serializer = require('../serializers/video');

// const mongoose = require('mongoose');
// require('../models/video');
// const Video = mongoose.model('Video');

/* GET home page. */
router.get('/', (req, res, next) => {
  //geolocate by user IP
  let country_iso = 'fr';
  let city = 'Paris';
  const geo = geoip.lookup(req.ip);
  if (geo) {
    country_iso = geo.country;
    city = geo.city;
  }
  //find city bounds
  let geocoding = googlemaps.geocode(null, city, country_iso);
  let geocode;
  try {
    geocoding
        .then((result) => {
          geocode = result.json.results.pop();
          let radius = Math.min(
              Math.max(
                  geolib.getDistanceBetween(geocode.geometry.location, geocode.geometry.viewport.southwest),
                  geolib.getDistanceBetween(geocode.geometry.location, geocode.geometry.viewport.northeast)
              ),
              1000000);
          youtubesearch.searchList(geocode.geometry.location, radius, function(err, result) {
            if (err) {
              console.log('youtube search list error');
              throw err;
            }
            let videoId = [];
            for (let i = 0; i < result.items.length; i++) {
              videoId.push(result.items[i].id.videoId);
            }
            youtubesearch.videosList(videoId.join(','), function(err, result) {
              if (err) {
                console.log('youtube videos list error');
                throw err;
              }
              return res.render('index', {
                // videos: videos,
                videos: serializer.initFromYoutubeCollection(result),
                place: geocode.formatted_address,
                geocode: JSON.stringify(geocode)
              });
            });
          });
        });
  } catch (error) {
    console.log(error);
    return next(error);
  }
  // Video
  //     .find()
  //     .sort({'date': -1})
  //     .limit(50)
  //     .exec((err, videos) => {
  //       if (err) {
  //         next(err);
  //         return;
  //       }
  // return res.render('index', {
  //   // videos: videos,
  //   videos: {},
  //   country: country
  // });
  // });
});

module.exports = router;