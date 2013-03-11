/**
 * Module dependencies.
 */

//require('v8-profiler');

var express = require('express')
  //, gzippo = require('gzippo')
  //, routes = require('./routes')
  //, user = require('./routes/user')
  , status = require('./routes/status')
  , http = require('http')
  , path = require('path')
  , assert = require('assert')
  , utest = require('./test')
  //, memwatch = require('memwatch')
  //, Crawler = require('./weibo/crawler')
  , Weibo = require('./weibo/weibo')
  , Robot = require('./robot');

var app = express();
var weibo = new Weibo(true);
var robot = new Robot(weibo);
var oauthHandler = weibo.authenticate(
  {successRedirect: '/', failureRedirect: '/user/login'},
  //robot.run( function(error, result) { assert.equal(null, error) } )
  function(error, params) {
    utest.test(weibo);
  }
);

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  
  //app.use(gzippo.staticGzip(__dirname + '/public'));
  //app.use(gzippo.compress());
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/auth/weibo', oauthHandler);
app.get('/auth/weibo/callback', oauthHandler);


app.get('/status/:type/:name?/:page?', status.handler);
//app.get('/status/db/:name', status.stats);
//app.get('/robot/:type/:page?', status.user);
//app.get('/robot/status/:page?', status.status);
//app.get('/status/crawler/:page', status.crawler);

//app.get('/', routes.index);
//app.get('/user', user.list);
//app.get('/status', status.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/*
// report to console postgc heap size
memwatch.on('stats', function(d) {
  console.log("postgc:", d.current_base);
});

memwatch.on('leak', function(d) {
  console.log("leak:", d);
});

// also report periodic heap size (every 10s)
setInterval(function() {
  console.log("naive:", process.memoryUsage().heapUsed);
}, 10000);
*/

