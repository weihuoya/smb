
var SinaProvider = require('./provider')
  , SinaCrawler = require('./crawler')
  , Metrics = require('./metrics')
  , async = require('asyncjs')
  ,_ = require('../underscore');

module.exports = SinaRobot;

function SinaRobot(weibo) {
  var self = this;
  this.crawler = new SinaCrawler(weibo);
  this.provider = new SinaProvider();
  
  var bundle = {
    status: {
      todo: function(id, callback) {
        self.provider.user.find(id, {_id: 0, id: 1, statuses_count: 1}, function(error, user) {
          if(error) return callback(error);
          
          if(user && user.statuses_count > 10)
            return callback(null, user.statuses_count);
          else
            return callback(null, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.status.count({uid: id}, callback);
      },
      
      worker: function(id, callback) {
        var counter = 0;
        var action = self.savePosts.bind(self);
        
        range(id, false, function(error, cid) {
          if(error) return callback(error);
          self.crawler.getStatuses(id, null, cid ? cid : null, action, function(error, count1) {
            if(error) return callback(error);
            range(id, true, function(error, cid) {
              if(error) return callback(error);
              self.crawler.getStatuses(id, cid ? cid : null, null, action, function(error, count2) {
                if(error) return callback(error);
                console.log('[R] lower count: '+count1+', upper count: '+count2+', total count: '+(count1 + count2));
                counter = count1 + count2;
                //callback(null, count1 + count2);
                verify(id, null, null, function(error, data1) {
                  if(error) return callback(error);
                  repair(id, data1, function(error, data2) {
                    if(error) return callback(error);
                    if(Array.isArray(data2)) counter += data1.length - data2.length;
                    callback(null, counter);
                  });
                });
              });
            });
          });
        });
        
        function range(id, flag, callback) {
          self.provider.status.id.max(id, flag, function(error, circle) {
            if(error) return callback(error);
            if(circle && circle.cid) {
              console.log('[R] db status id find '+ (flag?'max':'min') +': ' + circle.cid);
              callback(null, circle.cid);
            } else  {
              self.provider.status.max({uid: id}, flag, function(error, status) {
                if(error) return callback(error);
                if(status && status.id) {
                  console.log('[R] db status find '+ (flag?'max':'min') +': ' + status.id);
                  callback(null, status.id);
                } else {
                  callback();
                }
              });
            }
          });
        }
        
        function repair(id, lost, callback) {
          if(!Array.isArray(lost) || lost.length < 1) return callback();
          var min = lost[0], max = lost.length>1?lost[lost.length-1]:lost[0]+1;
          self.crawler.getStatuses(id, min, max, action, function(error, count) {
            if(error) return callback(error);
            verify(id, min, max, function(error, data) {
              if(lost.length === data.length) {
                console.log('[R] status lost id count: '+data.length, data);
                callback(null, data);
              } else {
                repair(id, data, callback);
              }
            });
          });
        }
        
        function verify(uid, min, max, callback) {
          var lost = [];
          
          if(!callback) {
            if(typeof max === 'function') {
              callback = max;
              max = null;
            } else if(typeof min === 'function') {
              callback = min;
              min = null;
            }
          }
          
          /*self.provider.status.id.duplicate(uid, function(error, items) {
            if(error) return callback(error);
            console.log('[R] status ids duplicate: ', items);
            repeater();
          });*/
          
          repeater(min, max);
          
          function repeater(min, max) {
            self.provider.status.id.page(uid, 50, min?min:null, max?max:null, function(error, data) {
              if(error) return callback(error);
              
              if(Array.isArray(data) && data.length > 0) {
                if( (min && min.cid === data[0].cid) || (max && max.cid === data[0].cid) ) data.shift();
                if(data.length > 0) {
                  async.list(data).each(function(item, next) {
                    self.provider.status.find(item.cid, {_id: 0, id: 1}, function(error, status) {
                      if(error) return next(error);
                      if(!status) { lost.push(item.cid); }
                      next();
                    });
                  }).end(function(error, result) {
                    repeater(data[data.length-1]);
                  });
                } else {
                  console.log('[R] status lost count: '+lost.length, lost);
                  callback(null, lost);
                }
              } else {
                console.log('[R] status lost count: '+lost.length, lost);
                callback(null, lost);
              }
            });
          }
        }
      }//end of status worker function
    },
    
    repost: {
      todo: function(id, callback) {
        self.provider.status.find(sid, {_id: 0, id: 1, reposts_count: 1}, function(error, status) {
          if(error) return callback(error);
          if(status && status.reposts_count)
            return callback(error, status.reposts_count);
          else
            return callback(error, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.status.count({sid: id}, callback);
      },
      
      worker: function(id, callback) {
        self.provider.status.max({sid: id}, false, function(error, repost) {
          if(error) return callback(error);
          var action = self.savePosts.bind(self);
          self.crawler.getReposts(id, null, repost ? repost.id : null, action, callback);
        });
      }
    },
    
    comment: {
      todo: function(id, callback) {
        self.provider.status.find(sid, {_id: 0, id: 1, comments_count: 1}, function(error, status) {
          if(error) return callback(error);
          
          if(user && user.comments_count > 10)
            return callback(null, user.comments_count);
          else
            return callback(null, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.comment.count({sid: id}, callback);
      },
      
      worker: function(id, callback) {
        var action = self.savePosts.bind(self);
        self.provider.comment.max({sid: id}, false, function(error, comment) {
          if(error) return callback(error);
          self.crawler.getComments(id, null, comment ? comment.id : null, action, callback);
        });
      }
    },
    
    status_id: {
      todo: function(id, callback) {
        self.provider.user.find(id, {_id: 0, id: 1, statuses_count: 1}, function(error, user) {
          if(error) return callback(error);
          if(user && user.statuses_count)
            callback(null, user.statuses_count);
          else
            callback(null, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.status.id.count(id, callback);
      },
      
      worker: function(id, callback) {
        self.provider.status.id.remove(id, function(error, result) {
          if(error) return callback(error);
          self.crawler.getStatusIds(id, null, null, function(data, callback) {
            self.provider.status.id.save(id, data, callback);
          }, callback);
        });
      }
    },
    
    friend: {
      todo: function(id, callback) {
        self.provider.user.find(id, {_id: 0, id: 1, friends_count: 1}, function(error, user) {
          if(error) return callback(error);
          if(user && user.friends_count)
            return callback(null, user.friends_count);
          else
            return callback(null, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.friend.count(id, callback);
      },
      
      worker: function(id, callback) {
        self.provider.friend.remove(id, function(error, data) {
          if(error) return callback(error);
          
          //获取所有好友的用户ID
          self.crawler.getFriendsIds(id, function(data, callback) {
            self.provider.friend.save(id, data, callback);
          }, function(error, count) {
            if(error) return callback(error);
            var action = self.saveUsers.bind(self);
            //获取所有好友的用户信息
            self.crawler.getFriends(id, action, callback);
          });
        });
      }
    },
    
    follower: {
      todo: function(id, callback) {
        self.provider.user.find(id, {_id: 0, id: 1, followers_count: 1}, function(error, user) {
          if(error) return callback(error);
          if(user && user.followers_count)
            return callback(null, user.followers_count);
          else
            return callback(null, 0);
        });
      },
      
      count: function(id, callback) {
        self.provider.follower.count(id, callback);
      },
      
      worker: function(id, callback) {
        self.provider.follower.remove(id, function(error, data) {
          if(error) callback(error);
          
          self.crawler.getFollowersIds(id, function(data, callback) {
            self.provider.follower.save(id, data, callback);
          }, function(error, count) {
            if(error) return callback(error);
            var action = self.saveUsers.bind(self);
            self.crawler.getFollowers(id, action, callback);
          });
        });
      }
    }
  };

  for(var key in bundle) 
    this[key] = handler(bundle, key);

  function handler(bundle, x) {
    return function(id, callback) {
      bundle[x].todo(id, function(error, value) {
        if(error) return callback(erro);
        if(value > 0) {
          bundle[x].count(id, function(error, count) {
            if(error) return callback(error);
            console.log('[R] user '+x+' count: '+value+', db '+x+' count: '+count);
            
            //Metrics[x].userCount = value;
            //Metrics[x].dbCount = count;
            
            if(value === count || Math.abs(value - count) < 10)
              return callback(null, 0);
            else
              bundle[x].worker(id, callback);
          });
        } else  {
          bundle[x].worker(id, callback);
        }
      });
    };
  }
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
          self.handler(params.uid, callback);
        });
      });
    });
  };
}


SinaRobot.prototype.handler = function(user, callback) {
  var self = this, last = null, stack = [user], queue = [user];
  
  repeater();
  
  function repeater() {
    async.list( queue ).each( worker ).end( finalize );
  }

  function worker(uid, next) {
    console.log('[R] robot handler uid: '+uid);
    self.crawler.getUser(uid, function(error, user) {
      if(error) return next(error);
      //Metric.user();
      self.saveUsers(user, function(error, data) {
        if(error) return next(error);
        self.status_id(uid, function(error, count) {
          if(error) return next(error);
          self.status(uid, function(error, count) {
            if(error) return next(error);
            self.friend(uid, function(error, data) {
              if(error) return next(error);
              //self.follower(uid, function(error, data) {
              //  if(error) return next(error);
                next();
              //});
            });
          });
        });
      });
    });
  }
  
  function finalize(error, result) {
    self.provider.friend.page(stack[stack.length-1], null, null, last, function(error, data) {
      if(error) return callback(error);
      if(data.length > 0) {
        queue = data.map(function(item, index, array) {return item.cid; });
        last = queue[queue.length-1];
      } else {
        var xuid, xcid;
        if(stack.length > 1) {
          xuid = stack[stack.length-2];
          xcid = stack[stack.length-1];
        } else {
          xuid = stack[stack.length-1];
          xcid = null;
        }
        //console.log('[R] xuid: '+xuid+', xcid: '+xcid+', stack: ', stack);
        self.provider.friend.next(xuid, xcid, function(error, data) {
          if(error) return callback(error);
          if(data && data.cid) {
            stack.push(data.cid);
            last = null;
          } else {
            return console.log('[R] handler friend next: ', data);
          }
        });
      }
      repeater();
    });
  }
}


SinaRobot.prototype.user = function(uids, callback) {
  var self = this;
  var statuses = [];

  async.list(uids).each(function(uid, next) {
    self.provider.user.find(uid, {_id: 0, id: 1}, function(error, data) {
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
  //if(counter.repost > 1) Metrics.count(counter);
  //if(statuses.length > 1) Metrics.count({uid: statuses[0].uid, status: statuses.length});
  
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