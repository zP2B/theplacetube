const User = require('../models/user');

exports.user_view_get = function(req, res, next) {
  User.findOne({username: req.params.username}).exec(function(err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      err = new Error('User not found.');
      err.status = 401;
      return next(err);
    } else {
      res.render('profile_view', {profile: user});
    }
  });
};

exports.user_edit_get = function(req, res, next) {
  if (!req.session.user || req.session.user.username !== req.params.username) {
    let err = new Error('Forbidden access.');
    err.status = 403;
    return next(err);
  } else {
    User.findOne({username: req.params.username}).exec(function(err, user) {
      if (err) {
        return next(err);
      } else if (!user) {
        err = new Error('User not found.');
        err.status = 401;
        return next(err);
      } else {
        res.render('profile_edit', {profile: user});
      }
    });
  }
};

exports.user_edit_post = function(req, res, next) {
  if (!req.session.user) {
    let err = new Error('Forbidden access.');
    err.status = 403;
    return next(err);
  } else {
    //Trim and escape the name field.
    req.sanitize('username').escape();
    req.sanitize('username').trim();
    req.sanitize('email').escape();
    req.sanitize('email').trim();
    req.sanitize('place').escape();
    req.sanitize('place').trim();

    req.check('username')
        .notEmpty()
        .withMessage('Username required')
        .isAlphanumeric()
        .withMessage('Only letters and numbers are allowed');
    req.check('email')
        .notEmpty()
        .withMessage('Email required')
        .isEmail()
        .withMessage('Must be an email');
    //Run the validators
    let errors = req.validationErrors();
    //Create a genre object with escaped and trimmed data.
    let user = {
      username: req.body.username,
      email: req.body.email,
      place: req.body.place,
    };
    if (req.file) {
      //TODO remove old one
      user.avatar = req.file.filename;
    }
    if (errors) {
      console.error(errors);
      //If there are errors render the form again, passing the previously entered values and errors
      res.render('profile_edit', {title: 'Edit profile', profile: user, errors: errors});
    } else {
      User.findOneAndUpdate({_id: req.session.userId}, user, function(error, user) {
        if (error) {
          return next(error);
        } else {
          req.session.user = user;
          return res.redirect('/users/profile/' + user.username);
        }
      });
    }
  }
};

exports.user_profile_get = function(req, res) {
  if (req.session.user) {
    return res.redirect('/users/profile/' + req.session.user.username);
  } else {
    return res.redirect('/users/login');
  }
};