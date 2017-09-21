const Video = require('../models/video');
const getYouTubeID = require('get-youtube-id');

exports.video_view_get = function(req, res, next) {
  Video.findOne({'_id': '' + req.params.videoId}, function(err, video) {
    if (err) {
      return next(err);
    }
    if (!video) {
      let err = new Error('Video not found.');
      err.status = 404;
      return next(err);
    }
    res.render('video_view', {
      video: video,
      title: video.title,
    });
  });
};

exports.video_add_get = function(req, res, next) {
  if (!req.session.user) {
    let err = new Error('Forbidden access.');
    err.status = 403;
    return next(err);
  } else {
    res.render('video_add', {title: 'Add video'});
  }
};

exports.video_add_post = function(req, res, next) {
  if (!req.session.user) {
    let err = new Error('Forbidden access.');
    err.status = 403;
    return next(err);
  } else {
    req.check('youtubeId')
        .notEmpty()
        .withMessage('Youtube video id required')
        .custom(value => {
          return value.length === 11 || getYouTubeID(value) !== null;
        })
        .withMessage('Invalid Youtube ID/URL');

    const errors = req.validationErrors();
    const youtubeId = getYouTubeID(req.body.youtubeId);
    const video = req.body;
    if (youtubeId !== null) {
      video.youtubeId = youtubeId;
    }
    video.publisher = req.session.user;
    video.owner = req.body.owner === 'on';
    video.place.location.coordinates[0] = Number(video.place.location.coordinates[0]);
    video.place.location.coordinates[1] = Number(video.place.location.coordinates[1]);

    if (errors) {
      console.error(errors);
      res.render('video_add', {title: 'Add video', video: video, errors: errors});
    } else {
      Video.create(video, function(error) {
        if (error) {
          next(error);
        } else {
          return res.redirect('/users/profile/' + req.session.user.username);
        }
      });
    }
  }
};

exports.video_delete_get = function(req, res, next) {

};

exports.video_edit_get = function(req, res, next) {

};

exports.video_edit_post = function(req, res, next) {

};
