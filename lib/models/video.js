const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  youtubeId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: {
    type: String,
    trim: true
  },
  publisher: {
    type: Object,
    required: true
  },
  owner: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  place: {
    type: Object,
    properties: {
      name: String,
      country: String,
      city: String,
      state: String,
      location: {
        type: Object,
        properties: {
          type: {
            type: String,
            enum: 'Point',
            default: 'Point'
          },
          coordinates: {
            type: [Number],
            default: [0, 0]
          }
        }
      }
    }
  },
  rateCount : 0,
  rateValue : 0
});

VideoSchema.query.withinBounds = function(west, south, east, north) {
  return this.find({
      'place.location': {
        $geoWithin: {
          $box: [
            [Number(west), Number(south)],
            [Number(east), Number(north)],
          ],
        },
      },
  });
};

const Video = mongoose.model('Video', VideoSchema);
module.exports = Video;
