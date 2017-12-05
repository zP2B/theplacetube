const assert = require('assert');
const moment = require('moment');

const CATEGORY_ICONS = {
  1: '\uf008', //Film & Animation
  2: '\uf1b9', //Autos & Vehicles
  10: '\uf001', //Music
  15: '\uf1b0', //Pets & Animals
  17: '\uf1e3', //Sports
  18: '\uf008', //Short Movies
  19: '\uf072', //Travel & Events
  20: '\uf11b', //Gaming
  21: '\uf2ce', //Videoblogging
  22: '\uf09e', //People & Blogs
  23: '\uf086', //Comedy
  // 24: '\uf292', //Entertainment
  25: '\uf1ea', //News & Politics
  26: '\uf290', //Howto & Style
  27: '\uf19d', //Education
  28: '\uf0c3', //Science & Technology
  29: '\uf255', //Nonprofits & Activism
  30: '\uf008', //Movies
  31: '\uf008', //Anime/Animation
  32: '\uf279', //Action/Adventure
  33: '\uf1f9', //Classics
  34: '\uf0e6', //Comedy
  35: '\uf06e', //Documentary
  36: '\uf119', //Drama
  37: '\uf0c0', //Family
  38: '\uf0ac', //Foreign
  39: '\uf21e', //Horror
  40: '\uf0d0', //Sci-Fi/Fantasy
  41: '\uf21e', //Thriller
  // 42: '', //Shorts
  // 43: '', //Shows
  44: '\uf03d' //Trailers
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] ? CATEGORY_ICONS[category] : '\uf118';
}

exports.initFromYoutubeCollection = function(records, skipNotLocated = true) {
  let serialized = [];
  for (let i = 0; i < records.items.length; i++) {
    if (!skipNotLocated || (records.items[i].recordingDetails && records.items[i].recordingDetails.location.longitude && records.items[i].recordingDetails.location.longitude)) {
      serialized.push(initFromYoutube(records.items[i]));
    }
  }

  return serialized;
};

/**
 * @param record Search Resource youtube#searchResult
 * @returns {{youtubeId: string, title: string, description: (*|string|description|{type, trim}|string|string), tags: string, place: {name: string, city: string, state: string, country: string, location: {type: string, coordinates: [null,null]}}, publisher: {username: string, place: string, avatar: string}, date: string, owner: boolean}}
 */
function initFromYoutube(record) {
  assert.equal(record.kind, 'youtube#video', 'Unexpected object in youtube to video serializer');
  return {
    'youtubeId': record.id,
    'title': record.snippet.title,
    'description': record.snippet.description,
    'category_id': record.snippet.categoryId,
    'icon': getCategoryIcon(record.snippet.categoryId),
    'tags': record.snippet.tags,
    'date': record.snippet.publishedAt,
    'timeago': moment(record.snippet.publishedAt).fromNow(),
    'author': record.snippet.channelTitle,
    'location': {
      'lat': record.recordingDetails.location.latitude,
      'lng': record.recordingDetails.location.longitude
    },
    'statistics': record.statistics
  };
}
