const User = require('../models/user');
const fs = require('fs');

exports.user_view_get = function(req, res, next) {
  User.findOne({username: req.params.username}).exec(function(err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      err = new Error('User not found.');
      err.status = 401;
      return next(err);
    } else {
      res.render('profile', {profile: user});
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
        res.render('profile_form', {profile: user});
      }
    });
  }
};

exports.user_edit_post = function(req, res, next) {
  if (!req.session.user || req.session.user.username !== req.body.username) {
    let err = new Error('Forbidden access.');
    err.status = 403;
    return next(err);
  } else {

    //Check that the name field is not empty
    req.check('username', 'Username required').notEmpty();
    req.check('email', 'Email required').notEmpty();

    //Trim and escape the name field.
    req.sanitize('name').escape();
    req.sanitize('name').trim();
    req.sanitize('email').escape();
    req.sanitize('email').trim();
    req.sanitize('place').escape();
    req.sanitize('place').trim();

    //Run the validators
    let errors = req.validationErrors();

    //Create a genre object with escaped and trimmed data.
    let user = new User({
      username: req.body.username,
      email: req.body.email,
      place: req.body.place,
    });

    if (errors) {
      //If there are errors render the form again, passing the previously entered values and errors
      res.render('profile_form',
          {title: 'Edit profile', profile: user, errors: errors});
    }
    else {
      if (req.files && req.files.picture) {
        fs.readFile(req.files.picture, function(err, data) {
          let uploadPath = __dirname + '/public/uploads/' + req.session.userId;
          fs.writeFile(uploadPath, data, function(err) {
          });
        });
      }

      User.findOneAndUpdate({_id: req.session.userId}, user,
          function(error, user) {
            if (error) {
              return next(error);
            } else {
              req.session.userId = user._id;
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