var User = require('../models/user');
const {check, validationResult} = require('express-validator/check');
const {matchedData} = require('express-validator/filter');

exports.user_login_get = function(req, res, next) {
  res.render('login');
};

exports.user_login_post = function(req, res, next) {
  User.authenticate(req.body.logemail, req.body.logpassword,
      function(error, user) {
        if (error || !user) {
          var err = new Error('Wrong email or password.');
          err.status = 401;
          return next(err);
        }
        req.session.userId = user._id;
        req.session.user = user;
        res.redirect('/users/profile/' + user.username);
      });
};

exports.user_logout_get = function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        req.session.userId = null;
        req.session.user = null;
        return res.redirect('/');
      }
    });
  }
};

exports.user_join_get = function(req, res, next) {
  res.render('join');
};

exports.user_join_post = function(req, res, next) {

  //Check that the name field is not empty
  req.checkBody('email').isEmail();
  req.check('username', 'Username required').notEmpty();
  req.check('email', 'Email required').notEmpty();
  req.check('password', 'Password required').notEmpty();
  req.check('passwordConf', 'password2 is required').notEmpty();
  req.check('passwordConf', 'Password do not match').equals(req.body.password);

  //Create a user object with escaped and trimmed data.
  var user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });

  var errors = req.validationErrors(true);
  if (errors) {
    console.log(errors);
    //If there are errors render the form again, passing the previously entered values and errors
    res.render('join', {user: user, errors: errors});
  }
  else {
    //Trim and escape the name field.
    req.sanitize('name').escape();
    req.sanitize('name').trim();
    req.sanitize('email').escape();
    req.sanitize('email').trim();

    User.create(user, function(error, user) {
      if (error) {
        return next(error);
      } else {
        User.authenticate(req.body.email, req.body.password, function(error, user) {
              if (error || !user) {
                var err = new Error('Error on authenticate.');
                err.status = 401;
                return next(err);
              } else {
                req.session.userId = user._id;
                req.session.user = user;
                return res.redirect('/users/profile/' + user.username);
              }
            });
      }
    });

  }
};
