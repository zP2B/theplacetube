var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);

var app = express();

// database connect
var mongoDB = 'mongodb://localhost/dronemap';
mongoose.connect(mongoDB);
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  // we're connected!
});

//use sessions for tracking logins
app.use(session({
  secret: 'no pain no gain',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db,
  }),
}));
app.locals.inspect = require('util').inspect;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap'));
app.use('/font-awesome',
    express.static(__dirname + '/node_modules/font-awesome'));
app.use('/open-iconic',
    express.static(__dirname + '/node_modules/open-iconic'));

app.use(function(req, res, next) {
  res.locals.userId = req.session.userId;
  res.locals.user = req.session.user;
  next();
});

// routes
var index = require('./routes/index');
var users = require('./routes/users');
app.use('/', index);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

function logErrors (err, req, res, next) {
  console.error(err.stack);
  next(err);
}
app.use(logErrors);// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  logErrors(err,req,res,next);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
