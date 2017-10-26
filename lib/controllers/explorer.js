'use strict';

const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');
const googlemaps = require('../services/google-maps');
const geolib = require('../services/geolib');
const youtubesearch = require('../services/youtube-search');
const serializer = require('../serializers/video');

exports.index = (req, res, next) => {
  //geolocate by user IP
  let countryIso = 'fr';
  let city = 'Paris';
  const geo = geoip.lookup(req.ip);
  if (geo) {
    countryIso = geo.country;
    city = geo.city;
  }
  //find city bounds
  let geocoding = googlemaps.geocode(null, city, countryIso);
  let geocode;
  try {
    geocoding
        .then((result) => {
          /** @namespace geocode.geometry.viewport.southwest */
          /** @namespace geocode.geometry.viewport.northeast */
          /** @namespace geocode.formatted_address */
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
                description: 'Geolocation videos explorer',
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
};

exports.xhrRefresh = (req, res, next) => {
  try {
    var location = {lat: req.query.lat, lng: req.query.lng};
    var north = {lat: req.query.nelat, lng: req.query.lng};
    var east = {lat: req.query.lat, lng: req.query.nelng};
    let radius = Math.min(
        geolib.getDistanceBetween(location, north),
        geolib.getDistanceBetween(location, east),
        1000000
    );
    console.log('distance %d', radius);
    youtubesearch.searchList(location, radius, function(err, result) {
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
        return res.json(serializer.initFromYoutubeCollection(result));
      });
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
