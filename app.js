var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var config = require('./config.js');
var nforce = require('nforce');
var routes = require('./routes/index');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// get a reference to the socket once a client connects
var socket = io.sockets.on('connection', function (socket) { });

var org = nforce.createConnection({
  clientId: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
  redirectUri: config.CALLBACK_URL ,
  mode: 'single',
  environment: config.ENVIRONMENT  // optional, sandbox or production, production default
});

org.authenticate({ username: config.USERNAME, password: config.PASSWORD }, function(err, oauth) {

  if(err) return console.log(err);
  if(!err) {
    console.log('*** Successfully connected to Salesforce ***');
   
  }

  var cj = org.createStreamClient({ topic: '/data/CaseChangeEvent', replayId: -2 });
	var str = cj.subscribe({ topic: '/data/CaseChangeEvent', oauth: oauth });

	str.on('connect', function(){
		console.log('Connected to topic: ' + '/data/CaseChangeEvent');
	});

	str.on('error', function(error) {
		console.log('Error received from topic: ' + error);
	});

	str.on('data', function(data) {
		console.log('Received the following from topic ---');
		console.log(data);
		socket.send(JSON.stringify(data));
	});
});



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(function(req, res, next){
  res.io = io;
  next();
});

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

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


module.exports = {app: app, server: server, org: org, config: config};
exports.org = org;
exports.config = config;
exports.socket = socket;