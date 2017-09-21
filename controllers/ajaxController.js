const config = require('../config');
const google = require('googleapis');
const youtube = google.youtube('v3');
const Video = require('../models/video');
const axios = require('axios');

exports.get_place_tubes = function(req, res, next) {
  //find the place
  axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      'q': req.query.search,
      'format': 'json',
    },
  }).then((response) => {
    const data = response.data.shift();
    console.log(Number(data.boundingbox[2])+'/'+Number(data.boundingbox[0])+'/'+Number(data.boundingbox[3])+'/'+Number(data.boundingbox[1]));
    Video.find()
        .withinBounds(Number(data.boundingbox[2]), Number(data.boundingbox[0]), Number(data.boundingbox[3]), Number(data.boundingbox[1]))
        .sort({date: -1})
        .exec((err, videos) => {
          if (err) {
            next(err);
            return;
          }
          data.videos = videos;
          res.json(data);
        });
  }).catch((error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }
    console.log(error.config);
  });
};
exports.get_bounds_tubes = function(req, res, next) {
  Video.find()
      .withinBounds(Number(req.query.west), Number(req.query.south), Number(req.query.east), Number(req.query.north))
      .sort({date: -1})
      .exec((err, videos) => {
        if (err) {
          next(err);
          return;
        }
        console.log(videos);
        res.json(videos);
      });
};

exports.get_youtube_details = function(req, res) {
  youtube.videos.list({
    auth: config.google.api_key,
    id: req.params.id,
    part: 'recordingDetails,snippet',
  }, function(err, record) {
    res.json(record.items.pop());
  });
};

exports.get_youtube_search = function(req, res) {
  console.log(req.query.search);
  youtube.search.list({
    auth: config.google.api_key,
    part: 'snippet',
    // location: '(' + req.params.latitude + ',' + req.params.longitude + ')',
    // locationRadius: '50km',
    maxResults: '50',
    // order: '',
    // pageToken: req.params.pageToken,
    q: req.query.search,
    // regionCode: req.params.country,
    type: 'video',
    videoDefinition: 'high',
    videoEmbeddable: 'true',
    safeSearch: 'none' //'strict' || 'moderate'
  }, function(err, list) {
    console.error(err);
    // console.log(list);
    const identifiers = list.items.map(function(elem) {
      return elem.id.videoId;
    });
    console.log(identifiers);
    youtube.videos.list({
      auth: config.google.api_key,
      id: identifiers.join(','),
      part: 'recordingDetails,snippet',
    }, function(err, list) {
      console.error(err);
      const filtered = list.items.filter(item => item.recordingDetails !== undefined);
      res.json(filtered);
    });
  });
};