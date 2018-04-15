const video = require('./video');

test('serialize', () => {
  var date = new Date(new Date() - 60000);
  var input = {
    'kind': 'youtube#video',
    'id': 'id',
    'snippet': {
      'title': 'title',
      'description': 'description',
      'categoryId': 1,
      'tags': 'tags',
      'publishedAt': date,
      'channelTitle': 'channelTitle'
    },
    'recordingDetails': {
      'location': {
        'latitude': 'latitude',
        'longitude': 'longitude'
      }
    },
    'statistics': {
      'views': 'views'
    }
  };
  var expected = {
    'youtubeId': 'id',
    'title': 'title',
    'description': 'description',
    'category_id': 1,
    'icon': '\uf008',
    'tags': 'tags',
    'date': date,
    'timeago': 'a minute ago',
    'author': 'channelTitle',
    'location': {
      'lat': 'latitude',
      'lng': 'longitude'
    },
    'statistics': {
      'views': 'views'
    }
  };
  expect(video.initFromYoutubeCollection({'items': [input]})).toEqual([expected]);
});
