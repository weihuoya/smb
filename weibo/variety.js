var Db = require('mongodb').Db
  , Connection = require('mongodb').Connection
  , Server = require('mongodb').Server
  , BSON = require('mongodb').BSON
  , ObjectID = require('mongodb').ObjectID
  , async = require('asyncjs');
  
  
module.exports = Variety;


function Variety(host, port) {
  this.host = host || 'localhost';
  this.port = port || 27017;
  this.db = undefined;
}


Variety.prototype.open = function(host, port, callback) {
  if(!callback) {
    if(typeof host === 'function') {
      callback = host;
    } else if(typeof port === 'function') {
      callback = port;
      this.host = host;
    }
  } else {
    this.host = host;
    this.port = port;
  }

  this.db = new Db('sina-weibo', new Server(this.host, this.port, {auto_reconnect: true}), {safe: false});
  this.db.open(callback);
}


Variety.prototype.list = function(callback) {
  var self = this;
  var db = new Db('local', new Server(self.host, self.port, {'auto_reconnect': false, 'poolSize': 1}), {safe: false});
  
  db.open(function(error, db) {
    if(error) return callback(error);
    db.admin(function(error, admin) {
      if(error) return callback(error);
      admin.listDatabases(callback);
    });
  });
}


Variety.prototype.info = function(callback) {
  var self = this;
  var db = new Db('local', new Server(self.host, self.port, {'auto_reconnect': false, 'poolSize': 1}), {safe: false});
  
  db.open(function(error, db) {
    if(error) return callback(error);
    db.admin(function(error, admin) {
      if(error) return callback(error);
      admin.buildInfo(callback);
    });
  });
}


Variety.prototype.stats = function(name, callback) {
  var self = this;
  var db = new Db(name, new Server(self.host, self.port, {'auto_reconnect': false, 'poolSize': 1}), {safe: false});
  
  db.open(function(error, db){
    if(error) return callback(error);
    db.collections(function(error, collections) {
      if(error) return callback(error);
      var vector = [];
      async.list(collections).each(function(item, next) {
        item.stats(function(error, stats) {
          if(error) next(error);
          var x = stats.ns.lastIndexOf('.')+1;
          stats.ns = stats.ns.substr(x);
          stats.avgObjSize = Math.floor(stats.avgObjSize);
          //index name and remove default _id index
          stats.indexSizes = Object.keys(stats.indexSizes);
          stats.indexSizes.shift();
          //mongodb 2.2
          if(typeof stats.systemFlags === 'undefined') stats.systemFlags = 0;
          if(typeof stats.userFlags === 'undefined') stats.userFlags = 0;
          vector.push(stats);
          next();
        });
      }).end(false, function(error, result) {
        if(error) return callback(error);
        callback(null, vector);
      });
    });
  });
}






