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
 *
 * @param params
 * @param callback
 */
exports.searchList = function(params, callback) {
  youtube.search.list(
      Object.assign(
          {
            auth: nconf.get('google_api_key'),
            fields: 'items(id/videoId),nextPageToken,pageInfo',
            maxResults: '50',
            order: 'viewCount',
            part: 'snippet',
            type: 'video',
            safeSearch: 'none',
            videoEmbeddable: true
          },
          params
      ),
      callback
  );
};

/**
 * QUOTA IMPACT: 5
 * @param id
 * @param callback
 */
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