const nconf = require('nconf');
const google = require('googleapis');
const youtube = google.youtube('v3');
const Video = require('../models/video');
const axios = require('axios');
const serializer = require('../serializers/video');
//load config
nconf
    .argv()
    .env()
    .file({file: '../config.json'});

exports.get_place_coordinates = function(req, res, next) {
  let request = {};
  if (req.query.city || req.query.state || req.query.country) {
    request = {
      'street': req.query.place,
      'city': req.query.city,
      'state': req.query.state,
      'country': req.query.country
    };

  } else {
    request.q = req.query.place;
  }
  request.format = 'json';
  axios.get('http://nominatim.openstreetmap.org/search', {
    params: request
  }).then((response) => {
    const data = response.data.shift();
    res.json(data);
  }).catch((error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log('Error', error.message);
    }
    console.log(error.config);
    next(error);
  });
};

exports.get_place_tubes = function(req, res, next) {
  //find the place
  axios.get('http://nominatim.openstreetmap.org/search', {
    params: {
      'q': req.query.search,
      'format': 'json'
    }
  }).then((response) => {
    const data = response.data.shift();
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
        res.json(videos);
      });
};

exports.get_youtube_details = function(req, res) {

  youtube.videos.list({
    auth: nconf.get('google_api_key'),
    id: req.params.id,
    part: 'recordingDetails,snippet'
  }, function(err, record) {
    res.json(record.items.pop());
  });
};

//unused
exports.get_youtube_search = function(req, res) {
  youtube.search.list({
    auth: nconf.get('google_api_key'),
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
    const identifiers = list.items.map(function(elem) {
      return elem.id.videoId;
    });
    youtube.videos.list({
      auth: nconf.get('google_api_key'),
      id: identifiers.join(','),
      part: 'recordingDetails,snippet'
    }, function(err, list) {
      console.error(err);
      const filtered = list.items.filter(item => item.recordingDetails !== undefined);
      res.json(filtered);
    });
  });
};

exports.get_youtube_top = function(req, res, next) {
  let params = {
    auth: nconf.get('google_api_key'),
    maxResults: '20',
    part: 'snippet',
    // chart: 'mostPopular',
    type: 'video',
    location: req.query.latitude + ',' + req.query.longitude,
    locationRadius: Number(req.query.radius) >= 1000000 ? '1000km' : Number(req.query.radius).toFixed() + 'm',
    order: 'viewCount',
    fields: 'items(id(videoId))'
  };
  if (req.query.q) {
    params.q = req.query.q;
  }
  if (req.query.eventType) {
    //assert req.query.eventType === 'live' || 'completed'
    params.eventType = req.query.eventType;
  }
  if (req.query.videoCategoryId) {
    params.videoCategoryId = req.query.videoCategoryId;
  }
  youtube.search.list(params, function(err, record) {
    if (err) {
      console.error('youtube.search.list failed');
      return next(err);
    }
    let videoId = [];
    for (let i = 0; i < record.items.length; i++) {
      videoId.push(record.items[i].id.videoId);
    }
    youtube.videos.list({
      auth: nconf.get('google_api_key'),
      part: 'recordingDetails,snippet',
      id: videoId.join(',')
    }, function(err, record) {
      if (err) {
        console.error('youtube.videos.list failed');
        return next(err);
      }
      res.json(serializer.initFromYoutubeCollection(record));
    });
  });
};
