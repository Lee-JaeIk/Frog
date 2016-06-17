  var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'); 
var RedisStore = require('connect-redis')(session);
var client = require('redis').createClient();

var routes = require('./routes/index');
var users = require('./routes/users');
var members = require('./routes/members');
var activities = require('./routes/activities');
var interview = require('./routes/interview'); 
var postscript = require('./routes/postscript');
var web = require('./routes/web');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes 전에 써줘야 한다. 그래야 session이 적용된다.
app.use(session({
  store: new RedisStore({host:'localhost', port: 6379, client: client}),
  secret: 'keyboard cat',
  resave: false,
  cookie: { maxAge: (100*30*60*60*1000)},
  saveUninitialized: true,
}));

app.use('/', routes);
app.use('/users', users);
app.use('/members', members);
app.use('/activities', activities);
app.use('/interview', interview);
app.use('/postscript', postscript);
app.use('/web', web);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3000);
console.log("Frog Server started port 3000");
module.exports = app;
