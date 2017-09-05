const User = require('../models/user');

exports.user_login_get = function(req, res) {
  res.render('login');
};

exports.user_login_post = function(req, res, next) {
  User.authenticate(req.body.logemail, req.body.logpassword,
      function(error, user) {
        if (error || !user) {
          let err = new Error('Wrong email or password.');
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
    req.session.destroy(function(err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
};

exports.user_join_get = function(req, res) {
  res.render('join');
};

exports.user_join_post = function(req, res, next) {
  //Check that the name field is not empty
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
  req.check('password').notEmpty().withMessage('Password required');
  req.check('passwordConf')
      .notEmpty()
      .withMessage('Password confirmation required')
      .equals(req.body.password)
      .withMessage('Passwords do not match');
  //Trim and escape the name field.
  req.sanitize('username').escape();
  req.sanitize('username').trim();
  req.sanitize('email').escape();
  req.sanitize('email').trim();
  //Create a user object with escaped and trimmed data.
  let user = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
  });
  let errors = req.validationErrors(true);
  User.findOne({username: req.body.username}, function(err, record) {
    if (record !== null) {
      errors.username = {
        msg: 'This username is already in use',
        value: req.body.username,
      };
    }

    User.findOne({email: req.body.email}, function(err, record) {
      if (record !== null) {
        errors.email = {
          msg: 'This email is already in use',
          value: req.body.email,
        };
      }

      if (errors) {
        console.log('validation errors');
        console.log(errors);
        //If there are errors render the form again, passing the previously entered values and errors
        res.render('join', {user: user, errors: errors});
      }
      else {
        User.create(user, function(error) {
          if (error) {
            return next(error);
          } else {
            User.authenticate(
                req.body.email, req.body.password,
                function(error, user) {
                  if (error || !user) {
                    let err = new Error('Error on authenticate.');
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
    });
  });
};
