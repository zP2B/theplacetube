const google = require('googleapis');
const youtube = google.youtube('v3');
//load config
const nconf = require('nconf');
nconf
    .argv()
    .env()
    .file({file: '../config.json'});

exports.searchList = function(location, radius, callback) {
  let params = {
    auth: nconf.get('google_api_key'),
    maxResults: '20',
    part: 'snippet',
    // chart: 'mostPopular',
    type: 'video',
    location: location.lat + ',' + location.lng,
    locationRadius: radius + 'm',
    order: 'viewCount',
    fields: 'items(id(videoId))'
  };
  youtube.search.list(params, callback);
};

exports.videosList = function(id, callback) {
  youtube.videos.list(
      {
        auth: nconf.get('google_api_key'),
        part: 'recordingDetails,snippet',
        id: id
      },
      callback
  );
};