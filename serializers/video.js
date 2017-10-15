const assert = require('assert');
const categoryIcons = {
  1: 'cinema',
  2: 'car',
  10: 'music',
  15: 'dog-park',
  17: 'pitch',
  18: 'cinema',
  19: 'suitcase',
  21: 'circle',
  22: 'circle-stroked',
  23: 'theatre',
  24: 'cafe',
  25: 'town-hall',
  26: 'clothing-store',
  27: 'college',
  28: 'rocket',
  29: 'triangle',
  30: 'cinema',
  31: 'pitch',
  32: 'wetland',
  33: 'square',
  34: 'theatre',
  35: 'park',
  36: 'theatre',
  37: 'home',
  38: 'place-of-workship',
  39: 'danger',
  40: 'rocket',
  41: 'defibrillator',
};

function getCategoryIcon(category) {
  const DEFAULT_ICON = 'circle';
  return categoryIcons[category] ? categoryIcons[category] : DEFAULT_ICON;
}

/**
 *
 * @param record Search Resource youtube#searchResult
 * @returns {{youtubeId: string, title: string, description: (*|string|description|{type, trim}|string|string), tags: string, place: {name: string, city: string, state: string, country: string, location: {type: string, coordinates: [null,null]}}, publisher: {username: string, place: string, avatar: string}, date: string, owner: boolean}}
 */
exports.initFromYoutube = function(record) {
  assert.equal(record.kind, 'youtube#video', 'Unexpected object in youtube to video serializer');
  return {
    'youtubeId': record.id,
    'title': record.snippet.title,
    'description': record.snippet.description,
    'category_id': record.snippet.categoryId,
    'icon': getCategoryIcon(record.snippet.categoryId),
    'tags': record.snippet.tags,
    'place': {
      'name': '',
      'city': '',
      'state': '',
      'country': '',
      'location': {
        'type': 'Point',
        'coordinates': [record.recordingDetails.location.longitude, record.recordingDetails.location.latitude],
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
