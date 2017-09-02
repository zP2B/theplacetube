const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  ytid: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  title: String,
  author: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  channel: String,
  thumbnail: String,
  place: {
    type: Object,
    properties: {
      country: String,
      city: String,
      street: String
    }
  },
  loc: {
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
});

const Video = mongoose.model('Video', VideoSchema);
module.exports = Video;
