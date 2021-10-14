'use strict';

const geoip = require('geoip-lite');
const countries = require('i18n-iso-countries');
const googlemaps = require('../services/google-maps');
const geolib = require('../services/geolib');
const youtubesearch = require('../services/youtube-search');
const serializer = require('../serializers/video');
const logger = require('../logger');

exports.index = (req, res, next) => {
  logger.info("Index");
  //geolocate by user IP
  let countryIso = 'fr';
  let city = 'Paris';
  logger.info('geoip.lookup', req.ip);
  const geo = geoip.lookup(req.ip);
  if (geo) {
    countryIso = geo.country;
    city = geo.city;
  }
  //find city bounds
  let geocoding = googlemaps.geocode(null, city, countryIso);
  let geocode;
  let searchResult;
  let params;
  logger.info("googlemaps.geocode");
  logger.info(city, countryIso);
  geocoding
      .then((result) => {
        /** @namespace geocode.geometry.viewport.northeast */
        /** @namespace geocode.formatted_address */
        geocode = result.json.results.pop();
        let north = {lat: geocode.geometry.viewport.northeast.lat, lng: geocode.geometry.location.lng};
        let east = {lat: geocode.geometry.location.lat, lng: geocode.geometry.viewport.northeast.lng};
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
        logger.info('youtube.searchlist');
        return youtubesearch.searchList(params);
      })
      .then((searchList) => {
        searchResult = searchList;
        let videoId = [];
        searchList.data.items.map(function(item) {
          videoId.push(item.id.videoId);
        });
        logger.info('youtube.videolist');
        return youtubesearch.videosList(videoId.join(','));
      })
      .then((videosList) => {
        logger.info('render results');
        return res.render('index', {
          description: 'The world best youtube geolocation based search engine.',
          videos: serializer.initFromYoutubeCollection(videosList),
          place: geocode.formatted_address,
          geocode: JSON.stringify(geocode),
          nextPageToken: searchResult.nextPageToken,
          pageInfo: searchResult.pageInfo,
          params: params
        });
      })
      .catch(function(error) {
        logger.error("Index error", error);
        return next(error);
      });
};

exports.search = (req, res, next) => {
  logger.info("Searching");
  let location = {lat: req.query.lat, lng: req.query.lng};
  let north = {lat: req.query.boundlat, lng: req.query.lng};
  let east = {lat: req.query.lat, lng: req.query.boundlng};
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
  logger.info("Requesting youtube.searchlist");
  youtubesearch.searchList(params)
      .then((searchList) => {
        searchResult = searchList;
        let videoId = [];
        searchList.data.items.map(function(item) {
          videoId.push(item.id.videoId);
        });
        logger.info("Requesting youtube.videoslist");
        return youtubesearch.videosList(videoId.join(','));
      })
      .then((videosList) => {
        logger.info("Render json results");
        return res.json({
          videos: serializer.initFromYoutubeCollection(videosList),
          nextPageToken: searchResult.nextPageToken,
          pageInfo: searchResult.pageInfo
        });
      })
      .catch(function(error) {
        logger.error("Search error", error);
        return next(error);
      });
};
