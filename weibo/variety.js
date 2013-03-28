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
          //mongodb 2.2
          if(typeof stats.systemFlags === 'undefined') model.systemFlags = 0;
          if(typeof stats.userFlags === 'undefined') model.userFlags = 0;
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


Variety.prototype.user = function(id, callback) {
  
}

/*
{
  databases: [{name, sizeOnDisk, empty}],
  totalSize: 0
}

Variety.prototype.list = function(callback) {
  var self = this;
  
  self.db.admin(function(error, admin) {
    if(error) return callback(error);
    admin.listDatabases(function(error, dbs) {
      if(error) return callback(error);
      
      console.log('mongodb total size: '+dbs['totalSize']);
      
      async.list(dbs['databases'])
      .each(function(item, next) {
        console.log(item);
        self.stats(item.name, next);
      })
      .end(false, function(error, value) {
        
      });
      
    });
  });
}


Variety.prototype.stats = function(name, callback) {
  var self = this;
  var db = new Db(name, new Server(self.host, self.port, {'auto_reconnect': false, 'poolSize': 1}), {safe: false});

  db.open(function(error, db){
    if(error) return callback(error);
    
    db.collectionNames(function(error, items) {
      if(error) return callback(error);
      console.log(items);
    });
    
    db.collections(function(error, collections) {
      if(error) return callback(error);
      
      async.list(collections).each(function(item, next) {
        item.stats(function(error, stats) {
          if(error) next(error);
          console.log(stats);
          next();
        });
      }).end(false, callback);
      
    });
    
    
  });
}


// args is for internal usage only
Variety.prototype.each = function( obj, callback, args ) {
  var name,
    i = 0,
    length = obj.length,
    isObj = length === undefined || typeof obj === 'function';

  if ( args ) {
    if ( isObj ) {
      for ( name in obj ) {
        if ( callback.apply( obj[ name ], args ) === false ) {
          break;
        }
      }
    } else {
      for ( ; i < length; ) {
        if ( callback.apply( obj[ i++ ], args ) === false ) {
          break;
        }
      }
    }

  // A special, fast, case for the most common use of each
  } else {
    if ( isObj ) {
      for ( name in obj ) {
        if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
          break;
        }
      }
    } else {
      for ( ; i < length; ) {
        if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
          break;
        }
      }
    }
  }
  return obj;
}
*/













