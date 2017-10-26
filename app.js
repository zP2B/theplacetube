'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const nconf = require('nconf');
const util = require('util');
//security middleware
const helmet = require('helmet');

// routes
const index = require('./lib/routes/index');
const users = require('./lib/routes/users');
// const videos = require('./lib/routes/videos');

// TODO remove this nasty error handling
process.on('uncaughtException', (err) => {
  console.log('Caught exception: ' + err);
});

nconf
    .argv()
    .env()
    .file({file: './config.json'});

// Use native Node promises
mongoose.Promise = global.Promise;
// connect to MongoDB
mongoose
    .connect(nconf.get('mongodb_uri'), {useMongoClient: true})
    .catch((err) => console.error(err));

const app = express();
app.set('trust proxy', true);
app.use(helmet());
//use sessions for tracking logins
app.use(session({
  secret: 'no pain no gain',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: mongoose.connection
  })
}));

app.locals.inspect = util.inspect;
app.locals._ = require('underscore');
app.locals._.str = require('underscore.string');
app.locals.moment = require('moment');

app.locals.videoDescHelper = function(text) {
  return text.replace(/(?:\r\n|\r|\n)/g, '<br />');
};
app.locals.videoPlaceHelper = function(place) {
  return [place.name, place.city, place.state, place.country].filter(String).join(', ');
};
app.locals.videoTagsHelper = function(tags) {
  const array = tags.split(',').map(Function.prototype.call, String.prototype.trim).filter(String);
  let display = '';
  for (let i = 0, len = array.length; i < len; i++) {
    display += '<span class=\'badge badge-secondary mr-1\'><i class=\'fa fa-tag mr-1\'></i>' + array[i] + '</span>';
  }
  return display;
};
// view engine setup
app.set('views', path.join(__dirname, '/lib/views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/get-youtube-id', express.static(__dirname + '/node_modules/get-youtube-id'));

app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  res.locals.user = req.session.user;
  res.locals.baseUrl = req.protocol + '://' + req.get('host');
  res.locals.currentUrl = res.locals.baseUrl + req.originalUrl;
  res.locals.mapboxApiToken = nconf.get('mapbox_api_token');
  next();
});

app.use('/', index);
app.use('/users', users);
// app.use('/videos', videos);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  return next(err);
});

app.use(clientErrorHandler);

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    return res.status(500).send({error: err.message});
  }
  next(err);
}

app.use(errorhandler);

function errorhandler(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = app.get('env') === 'development' ? err : {};
  console.error(err.stack);
  res.status(err.status || 500);
  res.render('error');
}

module.exports = app;