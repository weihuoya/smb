
var SinaProvider = require('./weibo/provider')
  , SinaCrawler = require('./weibo/crawler')
  , Weibo = require('./weibo/weibo')
  , Metrics = require('./metrics')
  , async = require('asyncjs');

module.exports = SinaRobot;

function SinaRobot(weibo) {
  this.crawler = new SinaCrawler(weibo);
  this.provider = new SinaProvider();
}

SinaRobot.prototype.log = function() {
  console.log.apply(console, arguments);
}

SinaRobot.prototype.run = function(callback) {
  var self = this;
  return function(error, params) {
    if(error) return callback(error);
    self.provider.open(function(error) {
      if(error) return callback(error);
      self.provider.create(function(error) {
        if(error) return callback(error);
        self.crawler.adjustFrequency(function(error) {
          if(error) return callback(error);
          self.WeiboHandler(params.uid, callback);
        });
      });      
    });
  };
}

SinaRobot.prototype.status = function(uid, callback) {
  var self = this;
  console.log('[R] status uid:'+uid);
  self.provider.user.findById(uid, {_id: 0, id: 1, statuses_count: 1}, function(error, user) {
    if(error) return callback(error);
    if(!user) return handler(uid, callback);
    if(user.statuses_count < 10) return callback(null, 0);
    
    console.log(user);
    Metrics.total({uid: user.id, status: user.statuses_count});
    
    self.provider.status.count({uid: uid}, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({uid: uid, status: count});
      console.log('[R] status total='+user.statuses_count+', count='+count);
      
      if( user.statuses_count === count || (user.statuses_count > count && user.statuses_count < count + 5) ) {
        console.log('[R] status exsited and pass');
        callback(null, 0);
      } else {
        handler(uid, callback);
      }
    });
  });
  
  function handler(uid, callback) {
    self.provider.status.findMax({uid: uid}, false, function(error, status) {
      if(error) return callback(error);
      if(!status) {
        console.log('[R] findMax status is empty');
      } else {
        console.log('[R] status handler findMax......');
        console.log(status);
      }
      var action = self.savePosts.bind(self);
      self.crawler.getStatuses(uid, null, status ? status.id : null, action, callback);
    });
  }
}

SinaRobot.prototype.repost = function(sid, callback) {
  var self = this;
  self.provider.status.findById(sid, {_id: 0, id: 1, reposts_count: 1}, function(error, status) {
    if(error) return callback(error);
    if(!status) return handler(sid, callback);
    
    console.log(status);
    Metrics.total({sid: sid, uid: status.uid, repost: status.reposts_count});
    
    self.provider.status.count({sid: sid}, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({sid: sid, repost: count});
      console.log('[R] repost total='+status.reposts_count+', count='+count);
      
      if( status.reposts_count === count || (status.reposts_count > count && status.reposts_count < count + 5) ) {
        console.log('[R] repost exsited and pass');
        callback(null, 0);
      } else {
        handler(sid, callback);
      }
    });
  });
  
  function handler(sid, callback) {
    self.provider.status.findMax({sid: sid}, false, function(error, repost) {
      if(error) return callback(error);
      var action = self.savePosts.bind(self);
      self.crawler.getReposts(sid, null, repost ? repost.id : null, action, callback);
    });
  }
}


SinaRobot.prototype.comment = function(sid, callback) {
  var self = this;
  self.provider.status.findById(sid, {_id: 0, id: 1, comments_count: 1}, function(error, status) {
    if(error) return callback(error);
    if(status) return handler(sid, callback);
    
    console.log(status);
    Metrics.total({sid: sid, uid: status.uid, comment: status.comments_count});
    
    self.provider.comment.count({sid: sid}, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({sid: sid, comment: count});
      console.log('[R] comment total='+status.comments_count+', count='+count);
      
      if(status.comments_count === count || (status.comments_count > count && status.comments_count < count + 5) ) {
        console.log('[R] repost exsited and pass');
        callback(null, 0);
      } else {
        handler(sid, callback);
      }
    });
  });
  
  function handler(sid, callback) {
    self.provider.comment.findMax({sid: sid}, false, function(error, comment) {
      if(error) return callback(error);
      var max_id = null;
      if(comment) { max_id = comment.id; }
      var action = self.savePosts.bind(self);
      self.crawler.getComments(sid, null, max_id, action, callback);
    });
  }
}


SinaRobot.prototype.user = function(uids, callback) {
  var self = this;
  var statuses = [];

  async.list(uids).each(function(uid, next) {
    self.provider.user.findById(uid, {_id: 0, id: 1}, function(error, data) {
      if(error) return next(error);
      if(data) return next(error, data);
      self.crawler.getUser(uid, function(error, profile) {
        if(error) next(error);
        if(typeof profile.status !== 'undefined') {
          profile.status.uid = profile.id;
          statuses.push(profile.status);
          delete profile.status;
        }
        self.saveUsers(profile, next);
      });
    });
  }).end(function(error, data) {
    if(error) return callback(error);
    self.savePosts(statuses, callback);
  });
}


SinaRobot.prototype.friend = function(uid, callback) {
  var self = this;
  self.provider.user.findById(uid, {_id: 0, id: 1, friends_count: 1}, function(error, user) {
    if(error) return callback(error);
    if(!user) return handler(uid, callback);
    
    console.log(user);
    Metrics.total({uid: uid, friend: user.friends_count});
    
    self.provider.friend.count(uid, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({uid: uid, friend: count});
      console.log('[R] friends total='+user.friends_count+', count='+count);
      
      if( user.friends_count === count || (user.friends_count > count && user.friends_count < count + 5) ) {
        console.log('[R] friends exsited and pass');
        return callback(null, 0);
      } else if(count > 0) {
        self.provider.friend.remove(uid, function(error, data) {
          if(error) return callback(error);
          handler(uid, callback);
        });
      } else {
        handler(uid, callback);
      }
    });
  });

  function handler(uid, callback) {
    //获取所有好友的用户ID
    self.crawler.getFriendsIds(uid, function(data, callback) {
      self.provider.friend.save(uid, data, callback);
    }, function(error, count) {
      if(error) return callback(error);
      var action = self.saveUsers.bind(self);
      //获取所有好友的用户信息
      self.crawler.getFriends(uid, action, callback);
    });
  }
}

SinaRobot.prototype.status_ids = function(uid, callback) {
  var self = this;
  console.log('[R] status uid:'+uid);
  self.provider.user.findById(uid, {_id: 0, id: 1, statuses_count: 1}, function(error, user) {
    if(error) return callback(error);
    if(!user) return handler(uid, callback);
    if(user.statuses_count < 10) return callback(null, 0);
    
    console.log(user);
    Metrics.total({uid: user.id, status: user.statuses_count});
    
    self.provider.status.ids.count(uid, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({uid: uid, status: count});
      console.log('[R] status total='+user.statuses_count+', count='+count);
      
      if( user.statuses_count === count || (user.statuses_count > count && user.statuses_count < count + 5) ) {
        console.log('[R] status exsited and pass');
        return callback(null, count);
      } else if(count > 0) {
        self.provider.status.ids.remove(uid, function(error, data) {
          if(error) return callback(error);
          handler(uid, callback);
        });
      } else {
        handler(uid, callback);
      }
    });
  });
  
  function handler(uid, callback) {
    self.crawler.getStatusIds(uid, function(data, callback) {
      self.provider.status.ids.save(uid, data, callback);
    }, function(error, count) {
      if(error) return callback(error);
      var action = self.saveUsers.bind(self);
      self.crawler.getFollowers(uid, action, callback);
    });
  }
}

SinaRobot.prototype.follower = function(uid, callback) {
  var self = this;
  self.provider.user.findById(uid, {_id: 0, id: 1, followers_count: 1}, function(error, user) {
    if(error) return callback(error);
    if(!user) return handler(uid, callback);
    
    console.log(user);
    Metrics.total({uid: uid, follower: user.followers_count});
    
    self.provider.follower.count(uid, function(error, count) {
      if(error) return callback(error);
      
      Metrics.count({uid: uid, follower: count});
      console.log('[R] followers total='+user.followers_count+', count='+count);
      
      if(user.followers_count === count || (user.followers_count > count && user.followers_count < count + 5) ) {
        console.log('[R] followers exsited and pass');
        return callback(null, count);
      } else if(count > 0) {
        self.provider.follower.remove(uid, function(error, data) {
          if(error) return callback(error);
          handler(uid, callback);
        });
      } else {
        handler(uid, callback);
      }
    });
  });
  
  function handler(uid, callback) {
    self.crawler.getFollowersIds(uid, function(data, callback) {
      self.provider.follower.save(uid, data, callback);
    }, function(error, count) {
      if(error) return callback(error);
      var action = self.saveUsers.bind(self);
      self.crawler.getFollowers(uid, action, callback);
    });
  }
}


/**
 *  
**/
SinaRobot.prototype.WeiboHandler = function(uid, callback) {
  var uids;
  var self = this;
  var queue = [uid];
  worker(queue, 0);
  
  function worker(queue, counter) {
    if(counter < queue.length) {
      self.UserHandler(queue[counter], function(error, data) {
        if(error) return callback(error);
        worker(queue, counter+1);
      });
    } else {
      var max = queue.length > 1 ? queue[queue.length-1] : null;
      self.provider.friend.findPart({uid: queue[0]}, 100, null, max, function(error, data) {
        if(error) return callback(error);
        if(data.length > 0) {
          uids = data.map(function(item, index, array) {return data.cid; });
          queue = queue.concat(uids);
        } else if(queue.length > 1) {
          queue.shift();
          worker(queue, counter);
        } else {
          callback(new Error('weibo user queye is empty'));
        }
      });
    }
  }
}


SinaRobot.prototype.UserHandler = function(uid, callback) {
  var self = this;

  var robot = async.list([
    function(next) {
      self.friend(uid, next);
    },
    function(next) {
      self.follower(uid, next);
    },
    function(next) {
      Metrics.node({friend: uid});
      self.PostHandler(self.provider.friend, self.status.bind(self), uid, next);
    },
    function(next) {
      Metrics.node({follower: uid});
      self.PostHandler(self.provider.follower, self.status.bind(self), uid, next);
    },
    function(next) {
      self.PostHandler(self.provider.status, self.repost.bind(self), uid, next);
    },
    function(next) {
      self.PostHandler(self.provider.status, self.comment.bind(self), uid, next);
    }
  ]).call();
  
  self.provider.user.findById(uid, {id: 1, _id: 0}, function(error, profile) {
    if(error) return callback(error);
    if(profile) {
      //metrics
      Metrics.total({
        uid: uid,
        friend: profile.friends_count,
        follower: profile.followers_count,
        status: profile.statuses_count,
        favourite: profile.favourites_count,
        bi: profile.bi_followers_count,
      });
      
      return robot.end(callback);
    }

    self.crawler.getUser(uid, function(error, profile) {
      if(error) return callback(error);
      //metrics
      Metrics.total({
        uid: uid,
        friend: profile.friends_count,
        follower: profile.followers_count,
        status: profile.statuses_count,
        favourite: profile.favourites_count,
        bi: profile.bi_followers_count,
      });
      
      self.saveUsers(profile, function(error, result) {
        if(error) return callback(error);
        robot.end(callback);
      });
    });
  });
}


SinaRobot.prototype.PostHandler = function(collection, action, uid, callback) {
  var self = this;
  collection.findPart({uid: uid}, 100, repeater);

  function repeater(error, data) {
    if(error) return callback(error);
    console.log('[R] post handler data length:'+data.length);
    if(data.length < 1) {
      console.log(data);
      return callback(null, data);
    }
    async.list(data).each(function(item, next) {
      action(item.cid, next);
    }).end(false, function(error, result) {
      collection.findPart({uid: uid}, 100, null, data[data.length-1], repeater);
    });
  }
}


SinaRobot.prototype.ProfileHandler = function(collection, uid, callback) {
  var self = this;
  var counter = 0;
  collection.findPart({uid: uid}, 100, handler);
  
  function handler(error, data) {
    if(error) return callback(error);
    if(data.length < 1) return callback(null, counter);
    var uids = [];
    for(var i = 0; i < data.length; ++i) { uids.push(data[i].cid); }

    self.profiles(uids, function(error, count) {
      if(error) callback(error);
      async.list(uids).each(self.UserHandler.bind(self)).end(function(error, data) {
        if(error) callback(error);
        counter += 1;
        collection.findPart({uid: uid}, 100, null, data[--i], handler);
      });
    });
  }
}


SinaRobot.prototype.saveUsers = function(users, callback) {
  var self = this;
  var statuses = [];
  if(!Array.isArray(users)) { users = [users]; }
  if(users.length < 1) return;

  for(var i = 0; i < users.length; ++i) {
    if(typeof users[i].idstr !== 'undefined') delete users[i].idstr;
    if(typeof users[i].follow_me !== 'undefined') delete users[i].follow_me;
    if(typeof users[i].following !== 'undefined') delete users[i].following;
    if(typeof users[i].online_status !== 'undefined') delete users[i].online_status;
    if(typeof users[i].created_at !== 'undefined') users[i].created_at = new Date(users[i].created_at);
    if(typeof users[i].status !== 'undefined') {
      users[i].status.uid = users[i].id;
      statuses.push(users[i].status);
      delete users[i].status;
    }
  }
  
  console.log('[R] save user:'+users.length);
  
  if(statuses.length > 0) {
    self.savePosts(statuses, handler);
  } else {
    handler();
  }

  function handler(error) {
    self.provider.user.save(users, callback);
  }
}


SinaRobot.prototype.savePosts = function(posts, callback) {
  var self = this;
  var counter = {sid: 0, repost: 0}; //for reposts metrics
  var status;
  var users = [];
  var statuses = [];
  var comments = [];
  if(!Array.isArray(posts)) { posts = [posts]; }
  if(posts.length < 1) return;

  for(var i = 0; i < posts.length; ++i) {
    if(typeof posts[i].mid !== 'undefined') delete posts[i].mid;
    if(typeof posts[i].idstr !== 'undefined') delete posts[i].idstr;
    if(typeof posts[i].mlevel !== 'undefined') delete posts[i].mlevel;
    if(typeof posts[i].visible !== 'undefined') delete posts[i].visible;
    if(typeof posts[i].truncated !== 'undefined') delete posts[i].truncated;
    if(typeof posts[i].favorited !== 'undefined') delete posts[i].favorited;
    if(typeof posts[i].created_at !== 'undefined') posts[i].created_at = new Date(posts[i].created_at);
    
    if(typeof posts[i].user !== 'undefined') {
      posts[i].uid = posts[i].user.id;
      users.push(posts[i].user);
      delete posts[i].user;
    }
    
    if(typeof posts[i].retweeted_status !== 'undefined') {
      //reposts
      status = posts[i].retweeted_status;
      posts[i].sid = status.id;
      delete posts[i].retweeted_status;
      statuses.push(posts[i]);
      
      counter.sid = posts[i].sid;
      counter.repost += 1;
      
    } else if(typeof posts[i].status !== 'undefined') {
      //comments
      status = posts[i].status;
      posts[i].sid = status.id;
      delete posts[i].status;
      comments.push(posts[i]);
    } else {
      //statuses
      posts[i].sid = 0;
      statuses.push(posts[i]);
    }

    if(status) {
      posts.push(status);
      status = null;
    }
  }
  
  if(users.length > 0) {
    self.saveUsers(users, handler);
  } else {
    handler();
  }
  //metrics
  if(counter.repost > 1) Metrics.count(counter);
  if(statuses.length > 1) Metrics.count({uid: statuses[0].uid, status: statuses.length});
  
  console.log('[R] save status:'+statuses.length+', repost:'+counter.repost+', comment:'+comments.length);
  
  function handler(error) {
    if(error) return callback(error);
    if(comments.length > 0) {
      //metrics
      Metrics.count({sid: comments[0].sid, comment: comments.length});
      
      self.provider.comment.save(comments, function(error, result) {
        if(error) return callback(error);
        self.provider.status.save(statuses, callback);
      });
    } else {
      self.provider.status.save(statuses, callback);
    }
  }
}


Function.prototype.curry = function() {
  var fn = this;
  var args = Array.prototype.slice.call(arguments);
  return function() {
    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, 0)));
  };
}


