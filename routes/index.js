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
  geocoding
      .then((response) => {
        let geocode = response.json.results.pop();
        let radius = Math.min(
            Math.max(
                geolib.getDistanceBetween(geocode.geometry.location, geocode.geometry.viewport.southwest),
                geolib.getDistanceBetween(geocode.geometry.location, geocode.geometry.viewport.northeast)
            ),
            1000000);
        youtubesearch.searchList(geocode.geometry.location, radius, function(err, result) {
          console.log('youtube search list');
          if (err) {
            console.log(err);
            return next(err);
          }
          let videoId = [];
          for (let i = 0; i < result.items.length; i++) {
            videoId.push(result.items[i].id.videoId);
          }
          youtubesearch.videosList(videoId.join(','), function(err, result) {
            console.log('youtube videos list');
            if (err) {
              console.log(err);
              return next(err);
            }
            return res.render('index', {
              // videos: videos,
              videos: serializer.initFromYoutubeCollection(result),
              place: geocode.formatted_address
            });
          });
        });
      })
      .catch((err) => {
        console.log(err);
        return next(err);
      });

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