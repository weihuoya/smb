var Db = require('mongodb').Db
  , Connection = require('mongodb').Connection
  , Server = require('mongodb').Server
  , BSON = require('mongodb').BSON
  , ObjectID = require('mongodb').ObjectID
  , async = require('asyncjs')
  , Monitor = require('./monitor');
  

module.exports = SinaProvider;


var STATUS = 'status';
var COMMENT = 'comment';
var FRIEND = 0;
var FOLLOWER = 1;
var STATUSID = 2;


function SinaProvider(host, port) {
  this.host = host || 'localhost';
  this.port = port || 27017;
  this.db = undefined;
  
  this.user = undefined;
  this.follower = undefined;
  this.friend = undefined;
  this.status = undefined;
  this.comment = undefined;
  this.cluster = undefined;
  //Monitor();
}

SinaProvider.prototype.open = function(host, port, callback) {
  var self = this;

  if(typeof host === 'function') {
    callback = host;
    host = self.host;
    port = self.port;
  } else if(typeof port === 'function') {
    callback = port;
    host = host || self.host;
  } else {
    host = host || self.host;
    port = port || self.port;
  }

  var db = new Db('sina-weibo', new Server(host, port, {auto_reconnect: true}), {safe: false});
  db.open(function(error, db){
    if(error) return callback(error);
    self.host = host;
    self.port = port;
    self.db = db;

    self.user = new User(db);
    self.friend = new Circle(db, FRIEND);
    self.follower = new Circle(db, FOLLOWER);
    self.status = new Post(db, STATUS);
    self.status.id = new Circle(db, STATUSID); 
    self.comment = new Post(db, COMMENT);
    self.cluster = new Cluster(db, self);
    
    callback(null, self);
  });
}

SinaProvider.prototype.create = function(callback) {
  var self = this;
  
  self.user.create(function(error, collection) {
    if(error) callback(error);
    self.friend.create(function(error, collection) {
      if(error) callback(error);
      self.status.create(function(error, collection) {
        if(error) callback(error);
        self.comment.create(function(error, collection) {
          if(error) callback(error);
          callback(null, self);
        });
      });
    });
  });
}


SinaProvider.prototype.timeline = function(id, callback) {
  var timeline = new Post(this.db, 'timeline_' + id);
  
  timeline.create(function (error, collection) {
    if(error) return callback(error);
    callback(null, timeline);
  });
}


/**
 *  
**/
function Cluster(db, provider) {
  this.db = db, this.record = 'record', this.cluster = 'cluster', this.provider = provider;
}

(function () {
  this.record_count = function(date, callback) {
    var query = {};
    if(typeof date === 'function') {
      callback = date;
      date = 0;
    }
    this.db.collection(this.record, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).count(callback);
    });
  }
  
  this.record_find = function(id, callback) {
    this.db.collection(this.record, function(error, collection) {
      if(error) return callback(error);
      collection.findOne({id: id}, {fields: {_id: 0}}, callback);
    });
  }
  
  this.record_list = function(index, count, date, callback) {
    var query = {};
    if(typeof date === 'function') {
      callback = date;
      date = 0;
    }
    this.db.collection(this.record, function(error, collection) {
      if(error) return callback(error);
      collection.find(query, {fields: {_id: 0}}).sort({date_start: 1}).skip(index * count).limit(count).toArray(callback);
    });
  }
  
  this.cluster_count = function(query, callback) {
    if(typeof query === 'function') {
      callback = query;
      query = {};
    }
    this.db.collection(this.cluster, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).count(callback);
    });
  }
  
  this.cluster_page = function(index, count, query, callback) {
    var self = this, docs = [];
    if(typeof k === 'function') {
      callback = k;
      k = 1;
    }
    
    self.db.collection(self.cluster, function(error, collection) {
      if(error) return callback(error);
      
      collection.find(query, {fields: {_id: 0, sid: 1}}).sort({id: 1}).skip(index * count).limit(count)
      .toArray(function(error, records) {
        if(error) return callback(error);
        async.list(records).each(function(record, next) {
          self.provider.status.find(record.sid, function(error, status) {
            if(error) return callback(error);
            self.provider.user.find(status.uid, function(error, user) {
              if(error) return callback(error);
              status.user = user;
              docs.push(status);
              next();
            });
          });
        }).end(function(error) {
          if(error) return callback(error);
          callback(null, docs);
        });
      });
    });
  }
}).call(Cluster.prototype)


/**
 *  
**/
function User(db) {
  this.db = db, this.name = 'user';
}

(function() {
  this.create = function(callback){
    EnsureCollection(this.db, this.name, {id: 1, cid: 1}, {unique:true, background:true, dropDups:true}, callback);
  }
  
  this.count = function(user, callback){
    var query = {};
    if(typeof user === 'function') {
      callback = user;
    } else if(typeof user === 'string') {
      query = { screen_name: { $regex: '.*'+user+'.*', $options: 'i' } };
    }
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).count(callback);
    });
  }
  
  this.find = function(user, fields, callback) {    
    if(typeof fields === 'function') {
      callback = fields;
      fields = {
        _id: 0, id: 1, screen_name: 1, profile_image_url: 1, 
        followers_count: 1, friends_count: 1, statuses_count: 1
      };
    }

    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      if(typeof user === 'number') {
        collection.findOne({id: user}, {fields: fields}, callback);
      } else if(typeof user === 'string') {
        collection.find( { screen_name: { $regex: '.*'+user+'.*', $options: 'i' } }, {fields: fields}).toArray(callback);
      }
    });
  }
  
  this.page = function(index, count, user, callback) {
    var query = {};
    if(typeof user === 'function') {
      callback = user;
    } else if(typeof user === 'string') {
      query = {screen_name: { $regex: '.*'+user+'.*', $options: 'i' } }
    }
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query, {fields: {
        _id: 0, id: 1, screen_name: 1, profile_image_url: 1, 
        followers_count: 1, friends_count: 1, statuses_count: 1
        }}).sort({id: -1}).skip(index * count).limit(count).toArray(callback);
    });
  }
  
  //遍历用户
  this.each = function(callback, complete) {
    var self = this, count = 0;
    
    self.count(function(error, result) {
      if(error) complete(error);
      repeater(0, result, callback);
    });
    
    function repeater(since, limit, callback) {
      self.range(512, since, function(error, users) {
        if(error) return complete(error);
        var i = users.length, since;
        if(i > 0) {
          count += i;
          since = users[--i].id + 1;
          callback(users[i], handler);
        }
        function handler(error) {
          if(error) complete(error);
          if(i >= 0) return callback(users[--i], handler);
          else if(count < limit) repeater(since, limit, callback);
          else complete(null, limit);
        }
      });
    }
  }
  
  this.range = function(count, since, max, callback) {
    if(!callback) {
      if(typeof max === 'function') {
        callback = max;
        max = null;
      } else if(typeof since === 'function') {
        callback = since;
        since = null;
      } else if(typeof count === 'function') {
        callback = count;
        count = null;
      }
    }
    
    var query = {};
    
    if(since) {
      since = typeof since === 'object' ? since.id : since;
      if(max) {
        max = typeof max === 'object' ? max.id : max;
        query.id = {$gte: since, $lt: max};
      } else {
        query.id = {$gte: since};
      }
    } else if(max) {
      max = typeof max === 'object' ? max.id : max;
      query.id = {$lt: max};
    }
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      var cursor = collection.find(query, {fields: {
        _id: 0, id: 1, screen_name: 1, profile_image_url: 1, 
        followers_count: 1, friends_count: 1, statuses_count: 1
        }}).sort({id: -1});
      if(count) { cursor = cursor.limit(count); }
      cursor.toArray(callback);
    });
  }
  
  this.save = function(users, callback) {
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.insert(users, callback);
    });
  }
  
}).call(User.prototype)


/**
 *  
**/
function Circle(db, type) {
  this.db = db;
  this.type = type;
  this.name = 'circle';
}

(function() {
  this.create = function(callback){
    EnsureCollection(this.db, this.name, callback);
  }
  
  this.remove = function(uid, callback) {
    var query = {uid: uid, type: this.type};
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.remove(query, callback);
    });
  }
  
  this.count = function(uid, callback){
    var query = {uid: uid, type: this.type};
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).count(callback);
    });
  }
  
  this.duplicate = function(uid, callback) {
    var query = {$match: {type: this.type, uid: uid}};
    var pipelines = [query];
    
    pipelines.push({ $group: {_id: '$cid', count: {$sum: 1}} });
    pipelines.push({ $match: {count: {$gt: 1}} });
    pipelines.push({ $sort:  {count: 1} });
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.aggregate(pipelines, callback);
    });
  }
  
  this.stats = function(count, since, max, callback) {
    var key = 'uid';
    var pipelines = [];
    var query = {$match: {type: this.type, uid: undefined}};

    if(!callback) {
      if(typeof max === 'function') {
        callback = max;
        max = null;
      } else if(typeof since === 'function') {
        callback = since;
        since = null;
      } else if(typeof count === 'function') {
        callback = count;
        count = null;
      }
    }
    
    if(since) {
      if(max) {
        query.$match[key] = {$gte: since._id, $lt: max._id};
      } else {
        query.$match[key] = {$gte: since._id};
      }
    } else if(max) {
      query.$match[key] = {$lt: max._id};
    } else {
      query.$match[key] = {$exists: true};
    }
    
    pipelines.push(query);
    pipelines.push({ $group: {_id: '$uid', count: {$sum: 1}} });
    pipelines.push({ $sort:  {count: 1} });
    if(count) pipelines.push({ $limit: count });
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.aggregate(pipelines, callback);
    });
  }
  
  this.range = function(uid, count, since, max, callback) {
    var query = {uid: uid, type: this.type};
    
    if(!callback) {
      if(typeof max === 'function') {
        callback = max;
        max = null;
      } else if(typeof since === 'function') {
        callback = since;
        since = null;
      } else if(typeof count === 'function') {
        callback = count;
        count = null;
      }
    }
    
    if(since) {
      since = typeof since === 'object' ? since.cid : since;
      if(max) {
        max = typeof max === 'object' ? max.cid : max;
        query.cid = {$gte: since, $lt: max};
      } else {
        query.cid = {$gte: since};
      }
    } else if(max) {
      max = typeof max === 'object' ? max.cid : max;
      query.cid = {$lt: max};
    }
    
    //console.log('[P] circle page params: '+uid+' '+count+' '+since+' '+max+', query: ', query);
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      var cursor = collection.find(query, {fields: {_id: 0, uid: 1, cid: 1}}).sort({cid: 1});
      if(count) { cursor = cursor.limit(count); }
      cursor.toArray(callback);
    });
  }
  
  this.max = function(uid, max_one, callback) {
    if(typeof max_one === 'function') callback = max_one;
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find({uid: uid}, {fields: {uid: 1, cid: 1, _id: 0}}).sort({cid: max_one?-1:1}).limit(1).nextObject(callback);
    });
  }
  
  this.next = function(uid, cid, callback) {
    var query;
    if(typeof uid === 'object' && typeof cid === 'function') {
      query = {uid: uid.uid, cid: {$gt: uid.cid?uid.cid:0}, type: this.type};
      callback = cid;
    } else {
      query = {uid: uid, cid: {$gt: cid?cid:0}, type: this.type};
    }
    console.log('[P] circle find next query: ', query);
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).sort({cid: 1}).limit(1).nextObject(callback);
    });
  }
  
  this.save = function(uid, friends, callback) {
    var circles = [];
    if( !Array.isArray(friends) ) { friends = [friends]; }
    for(var i = 0; i < friends.length; ++i) {
      circles.push({uid: uid, cid: friends[i], type: this.type});
    }
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.insert(circles, callback);
    });
  }
  
}).call(Circle.prototype)


/**
 *  
**/
function Post(db, name) {
  this.db = db;
  this.name = name;
}

(function() {
  this.create = function(callback){
    EnsureCollection(this.db, this.name, {id: 1}, {unique:true, background:true, dropDups:true}, callback);
  }
  
  this.count = function(query, callback){
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query).count(callback);
    });
  }
  
  this.timeline = function(id, callback) {
    var query;
    
    if(this.name === COMMENT) {
      query = {sid: id};
    } else if(this.name === STATUS) {
      query = {uid: id};
    }
    
    function map() {
      var year = this.created_at.getFullYear(), month = this.created_at.getMonth()+1, day = this.created_at.getDate();
      var id = year + '/' + (month < 10 ? '0' + month : month) + '/' + (day < 10 ? '0'+day : day);
      emit(id, 1);
    }
    
    function reduce(key, values) {
      var count = 0;
      values.forEach(function(v) { count += v; });
      return count;
    }
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.mapReduce(map, reduce, 
        {out: {replace: 'timeline'}, query: query}, 
        function(error, collection) {
          if(error) return callback(error);
          collection.find().toArray(callback);
      });
    });
  }
  
  this.stats = function(count, since, max, callback) {
    //status: uid
    //comment: sid
    var key;
    var pipelines = [];
    var query = {$match: {}};

    if(!callback) {
      if(typeof max === 'function') {
        callback = max;
        max = null;
      } else if(typeof since === 'function') {
        callback = since;
        since = null;
      } else if(typeof count === 'function') {
        callback = count;
        count = null;
      }
    }
    
    if(this.name === COMMENT) {
      key = 'sid';
    } else if(this.name === STATUS) {
      key = 'uid';
    }
    
    if(since) {
      if(max) {
        query.$match[key] = {$gte: since._id, $lt: max._id};
      } else {
        query.$match[key] = {$gte: since._id};
      }
    } else if(max) {
      query.$match[key] = {$lt: max._id};
    } else {
      query.$match[key] = {$exists: true};
    }
    
    pipelines.push(query);
    pipelines.push({ $group: {_id: '$'+key, count: {$sum: 1}} });
    pipelines.push({ $sort:  {count: 1} });
    if(count) pipelines.push({ $limit: count });
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.aggregate(pipelines, callback);
    });
  }
  
  this.find = function(id, fields, callback) {
    if(typeof fields === 'function') {
      callback = fields;
      if(this.name === STATUS) {
        fields = {_id: 0, id: 1, uid: 1, sid: 1, created_at: 1, reposts_count: 1, comments_count: 1, text: 1};
      } else {
        fields = {};
      }
    }
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.findOne({id: id}, {fields: fields},callback);
    });
  }
  
  this.range = function(query, count, since, max, callback) {
    var fields = {_id: 0, id: 1}, fields2 = {_id: 0, id: 1, uid: 1, sid: 1, created_at: 1, reposts_count: 1, comments_count: 1, text: 1};
    if(!callback) {
      if(typeof max === 'function') {
        callback = max;
        max = null;
      } else if(typeof since === 'function') {
        callback = since;
        since = null;
      } else if(typeof count === 'function') {
        callback = count;
        count = null;
      }
    }
    
    if(since) {
      if(since instanceof Date) {
        query.created_at = max ? {$gte: since, $lt: max} : {$gte: since}, fields = fields2;
      } else if(typeof since === 'object') {
        query.id = max ? {$gte: since.id, $lt: max.id} : {$gte: since.id};
      } else {
        query.id = max ? {$gte: since, $lt: max} : {$gte: since};
      }
    } else if(max) {
      if(max instanceof Date) {
        query.created_at = {$lt: max}, fields = fields2;
      } else if(typeof max === 'object') {
        query.id = {$lt: max.id};
      } else {
        query.id = {$lt: max};
      }
    }
    
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      var cursor = collection.find(query, {fields: fields}).sort({id: -1});
      if(count) { cursor = cursor.limit(count); }
      cursor.toArray(callback);
    });
  }

  this.max = function(query, max_one, callback) {
    if(typeof max_one === 'function') { callback = max_one; }
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.find(query, {fields: {id: 1, _id: 0}}).sort({id: max_one?-1:1}).limit(1).nextObject(callback);
    });
  }
  
  this.save = function(statuses, callback) {
    this.db.collection(this.name, function(error, collection) {
      if(error) return callback(error);
      collection.insert(statuses, callback);
    });
  }
  
}).call(Post.prototype)


/**
 *  
**/
function EnsureCollection(db, name, indexes, options, callback) {
  db.collectionNames(name, function(error, items) {
    if(error) return callback(error);
    var doAction;
    if(items.length === 0) {
      doAction = db.createCollection.bind(db);
    } else {
      doAction = db.collection.bind(db);
    }

    doAction(name, function(error, collection) {
      if(error) return callback(error);
      if(typeof indexes === 'function') {
        indexes(null, collection)
      } else {
        collection.ensureIndex(indexes, options, function(error, indexName) {
          callback(error, collection);
        });
      }
    });
  });
}



