'use strict';

const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');
const googlemaps = require('../services/google-maps');
const geolib = require('../services/geolib');
const youtubesearch = require('../services/youtube-search');
const serializer = require('../serializers/video');
const logger = require('../logger');

exports.index = (req, res, next) => {
  //geolocate by user IP
  let countryIso = 'fr';
  let city = 'Paris';
  const geo = geoip.lookup(req.ip);
  if (geo) {
    countryIso = geo.country;
    city = geo.city;
    logger.info('geoip', geo.city, geo.country);
  }
  //find city bounds
  let geocoding = googlemaps.geocode(null, city, countryIso);
  let geocode;
  let searchResult;
  let params;
  geocoding
      .then((result) => {
        /** @namespace geocode.geometry.viewport.northeast */
        /** @namespace geocode.formatted_address */
        geocode = result.json.results.pop();
        var north = {lat: geocode.geometry.viewport.northeast.lat, lng: geocode.geometry.location.lng};
        var east = {lat: geocode.geometry.location.lat, lng: geocode.geometry.viewport.northeast.lng};
        let radius = Math.min(
            Math.max(
                geolib.getDistanceBetween(geocode.geometry.location, north),
                geolib.getDistanceBetween(geocode.geometry.location, east)
            ),
            1000000);
        params = {
          location: geocode.geometry.location.lat + ',' + geocode.geometry.location.lng,
          locationRadius: radius + 'm'
        };
        if (req.query) {
          params = Object.assign(params, req.query);
        }
        logger.info('index', params);
        return youtubesearch.searchList(params);
      })
      .then((searchList) => {
        searchResult = searchList;
        let videoId = [];
        searchList.items.map(function(item) {
          videoId.push(item.id.videoId);
        });
        return youtubesearch.videosList(videoId.join(','));
      })
      .then((videosList) => {
        return res.render('index', {
          description: 'Explore the world with the place tube, the new youtube search engine on map.',
          videos: serializer.initFromYoutubeCollection(videosList),
          place: geocode.formatted_address,
          geocode: JSON.stringify(geocode),
          nextPageToken: searchResult.nextPageToken,
          pageInfo: searchResult.pageInfo,
          params: params
        });
      })
      .catch(function(error) {
        logger.error(error);
        return next(error);
      });
};

exports.search = (req, res, next) => {
  var location = {lat: req.query.lat, lng: req.query.lng};
  var north = {lat: req.query.boundlat, lng: req.query.lng};
  var east = {lat: req.query.lat, lng: req.query.boundlng};
  let radius = Math.min(
      geolib.getDistanceBetween(location, north),
      geolib.getDistanceBetween(location, east),
      1000000
  );
  let params = {
    location: location.lat + ',' + location.lng,
    locationRadius: radius + 'm'
  };
  if (req.query.params) {
    params = Object.assign(params, JSON.parse(req.query.params));
  }
  if (req.query.nextPageToken) {
    params.pageToken = req.query.nextPageToken;
  }
  logger.info('search', params);
  let searchResult;
  youtubesearch.searchList(params)
      .then((searchList) => {
        searchResult = searchList;
        let videoId = [];
        searchList.items.map(function(item) {
          videoId.push(item.id.videoId);
        });
        return youtubesearch.videosList(videoId.join(','));
      })
      .then((videosList) => {
        return res.json({
          videos: serializer.initFromYoutubeCollection(videosList),
          nextPageToken: searchResult.nextPageToken,
          pageInfo: searchResult.pageInfo
        });
      })
      .catch(function(error) {
        logger.error(error);
        return next(error);
      });
};
