'use strict';

const google = require('googleapis');
const youtube = google.youtube('v3');
const nconf = require('nconf');
nconf
    .argv()
    .env()
    .file({file: '../config.json'});

/**
 * QUOTA IMPACT: 100
 * @param params
 */
exports.searchList = function(params) {
  return new Promise((resolve, reject) => {
    youtube.search.list(
        Object.assign(
            {
              auth: nconf.get('google_api_key'),
              fields: 'items(id/videoId),nextPageToken,pageInfo',
              maxResults: '25',
              order: 'date',
              part: 'snippet',
              type: 'video',
              safeSearch: 'none',
              videoEmbeddable: true
            },
            params
        ),
        function(err, res) {
          return (err) ? reject(err) : resolve(res);
        }
    );
  });

};

/**
 * QUOTA IMPACT: 5
 * @param id
 */
exports.videosList = function(id) {
  return new Promise((resolve, reject) => {
    youtube.videos.list(
        {
          auth: nconf.get('google_api_key'),
          part: 'recordingDetails,snippet,statistics',
          id: id
        },
        function(err, res) {
          return (err) ? reject(err) : resolve(res);
        }
    );
  });
};
