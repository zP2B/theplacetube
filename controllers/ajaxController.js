const config = require('../config');
const google = require('googleapis');
const youtube = google.youtube('v3');
const Video = require('../models/video');
const axios = require('axios');
const serializer = require('../serializers/video');

exports.get_place_tubes = function(req, res, next) {
  //find the place
  axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      'q': req.query.search,
      'format': 'json',
    },
  }).then((response) => {
    const data = response.data.shift();
    console.log(Number(data.boundingbox[2]) + '/' + Number(data.boundingbox[0]) + '/' + Number(data.boundingbox[3]) + '/' + Number(data.boundingbox[1]));
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

exports.get_youtube_top = function(req, res, next) {
  youtube.search.list({
    auth: config.google.api_key,
    maxResults: '20',
    part: 'snippet',
    // chart: 'mostPopular',
    type: 'video',
    // eventType: 'live', //completed
    location: req.query.latitude + ',' + req.query.longitude,
    locationRadius: Number(req.query.radius) >= 1000000 ? '1000km' : Number(req.query.radius).toFixed() + 'm',
    order: 'viewCount',
    // q: 'live',
    fields: 'items(id(videoId))',
    // regionCode: 'fr'
    // videoCategoryId
  }, function(err, record) {
    if (err) {
      console.error('youtube.search.list failed');
      return next(err);
    }
    // return res.json(record);
    // console.log(record);
    let videoId = [];
    for (let i = 0; i < record.items.length; i++) {
      videoId.push(record.items[i].id.videoId);
    }
    // console.log(videoId);
    youtube.videos.list({
      auth: config.google.api_key,
      part: 'recordingDetails,snippet',
      id: videoId.join(','),
      // chart: 'mostPopular',
      // myRating:'like',
      // type: 'video',

      // eventType: 'live', //completed
      // location: '('+req.body.latitude+','+req.body.longitude+')',
      // locationRadius: Number(req.body.radius).toFixed() + 'm',
      // order: 'viewCount',
      // q: 'viral',
      // fields: ''
      // regionCode: 'fr'
      // videoCategoryId
    }, function(err, record) {
      if (err) {
        console.error('youtube.videos.list failed');
        return next(err);
      }
      let serialized = [];
      for (let i = 0; i<record.items.length; i++) {
        serialized.push(serializer.initFromYoutube(record.items[i]));
      }
      res.json(serialized);
    });
    // res.json(record);

  });
};
