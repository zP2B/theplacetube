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
const util = require('util');

// routes
const index = require('./routes/index');
const users = require('./routes/users');
const videos = require('./routes/videos');
// database connect
const mongoDB = 'mongodb://localhost/dronemap';
mongoose.connect(mongoDB);
const db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  // we're connected!
});

const app = express();

//use sessions for tracking logins
app.use(session({
  secret: 'no pain no gain',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db,
  }),
}));

app.locals.inspect = util.inspect;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap'));
app.use('/font-awesome', express.static(__dirname + '/node_modules/font-awesome'));
app.use('/open-iconic', express.static(__dirname + '/node_modules/open-iconic'));
app.use('/webcomponentsjs', express.static(__dirname + '/node_modules/webcomponentsjs'));

app.use(function(req, res, next) {
  res.locals.userId = req.session.userId;
  res.locals.user = req.session.user;
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/videos', videos);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

function logErrors(err, next) {
  console.error(err.stack);
  next(err);
}
app.use(logErrors);// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  logErrors(err, next);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
