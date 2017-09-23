const assert = require('assert');
/**
 *
 * @param record Search Resource youtube#searchResult
 * @returns {{youtubeId: string, title: string, description: (*|string|description|{type, trim}|string|string), tags: string, place: {name: string, city: string, state: string, country: string, location: {type: string, coordinates: [null,null]}}, publisher: {username: string, place: string, avatar: string}, date: string, owner: boolean}}
 */
exports.initFromYoutube = function(record) {
  assert.equal(record.kind, "youtube#video", "Unexpected object in youtube to video serializer");
  return {
    'youtubeId': record.id,
    'title': record.snippet.title,
    'description': record.snippet.description,
    'tags': record.snippet.tags,
    'place': {
      'name': '',
      'city': '',
      'state': '',
      'country': '',
      'location': {
        'type': 'Point',
        'coordinates': [record.recordingDetails.location.longitude, record.recordingDetails.location.latitude]
      },
    },
  'publisher': {
      'username': '',
      'place': '',
      'avatar': '',
    },
    'date': record.snippet.publishedAt,
    'owner': false,
  };
};
