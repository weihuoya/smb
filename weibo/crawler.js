/**
 *  
**/
module.exports = SinaCrawler;

function SinaCrawler(weibo) {
  this.weibo = weibo;
  this.pulse = 0;
  this.timeout = 10000;
}

SinaCrawler.prototype.getUserTags = function(uids, callback) {
  this.weibo.getTagsBatch(uids, function(error, data) {
    if(error) return callback(error);
    self.pulse += 1;
    callback(null, data);
  });
}

SinaCrawler.prototype.getUserRanks = function(uids, callback, complete) {
  if(!Array.isArray(uids)) { uids = [uids]; }
  var self = this;
  var counter = 0;
  worker();
  
  function worker() {
    self.weibo.getUserRank(uids[counter], handler);
  }
  
  function handler(error, data) {
    if(error) return complete(error);
    counter += 1;
    self.pulse += 1;
    callback(data, function(error, result) {
      if(error) return complete(error);
      if(counter < uids.length) {
        setTimeout(handler, self.timeout);
      } else {
        complete(null, counter);
      }
    });
  }
}

SinaCrawler.prototype.adjustFrequency = function(callback) {
  var self = this;
  self.weibo.getRateLimitStatus(function(error, data) {
    if(error) return callback && callback(error);
    self.timeout = data.reset_time_in_seconds / data.remaining_user_hits * 1500;
    setTimeout(self.adjustFrequency.bind(self), data.reset_time_in_seconds * 1001);
    return callback && callback(null, data);
  });
}

SinaCrawler.prototype.getUser = function(uid, callback) {
  var self = this;
  self.weibo.getUser(uid, function(error, data) {
    if(error) return callback(error);
    self.pulse += 1;
    callback(null, data);
  });
}

SinaCrawler.prototype.getUsers = function(uids, callback, complete) {
  var self = this;
  var counter = 0;
  if(!Array.isArray(uids)) { uids = [uids]; }
  worker();
  
  function worker() {
    self.getUser(uids[counter], handler);
  }
  
  function handler(error, data) {
    if(error) return complete(error);
    counter += 1;
    callback(data, function(error, result) {
      if(error) return complete(error);
      if(counter < uids.length) {
        setTimeout(worker, self.timeout);
      } else {
        complete(null, counter);
      }
    });
  }
}

SinaCrawler.prototype.getFriends = function(uid, callback, complete) {
  var action = this.weibo.getFriends.bind(this.weibo);
  return this.cursor_handler(uid, 200, action, callback, complete);
}

SinaCrawler.prototype.getFollowers = function(uid, callback, complete) {
  var action = this.weibo.getFollowers.bind(this.weibo);
  return this.cursor_handler(uid, 200, action, callback, complete);
}

SinaCrawler.prototype.getFriendsIds = function(uid, callback, complete) {
  var action = this.weibo.getFriendsIds.bind(this.weibo);
  return this.cursor_handler(uid, 5000, action, callback, complete);
}

SinaCrawler.prototype.getFollowersIds = function(uid, callback, complete) {
  var action = this.weibo.getFollowersIds.bind(this.weibo);
  return this.cursor_handler(uid, 5000, action, callback, complete);
}

SinaCrawler.prototype.getStatuses = function(uid, since_id, max_id, callback, complete) {
  var action = this.weibo.getUserTimeline.bind(this.weibo);
  return this.page_handler(uid, since_id, max_id, action, callback, complete);
}

SinaCrawler.prototype.getStatusIds = function(uid, since_id, max_id, callback, complete) {
  var action = this.weibo.getUserTimelineIds.bind(this.weibo);
  return this.page_handler(uid, since_id, max_id, action, callback, complete);
}

SinaCrawler.prototype.getHomeStatuses = function(uid, since_id, max_id, callback, complete) {
  var action = this.weibo.getHomeTimeline.bind(this.weibo);
  return this.page_handler(uid, since_id, max_id, action, callback, complete);
}

SinaCrawler.prototype.getReposts = function(sid, since_id, max_id, callback, complete) {
  var action = this.weibo.getRepostTimeline.bind(this.weibo);
  return this.page_handler(sid, since_id, max_id, action, callback, complete);
}

SinaCrawler.prototype.getComments = function(sid, since_id, max_id, callback, complete) {
  var action = this.weibo.getComment.bind(this.weibo);
  return this.page_handler(sid, since_id, max_id, action, callback, complete);
}


SinaCrawler.prototype.cursor_handler = function(uid, count, action, callback, complete) {
  var self = this;
  var counter = 0;
  var retry = 3;
  var paging = {count: count, cursor: 0};
  
  worker();

  function worker() {
    action(uid, paging, handler);
  }

  function handler(error, data) {
    if(error) return complete(error);
    self.pulse += 1;

    for(var i in data) {
      if(Array.isArray(data[i])) {
        if(data[i].length < 1) {
          if(--retry === 0) complete(null, counter);
          else repeater();
        } else {
          counter += data[i].length;
          callback(data[i], repeater);
        }
        break;
      }
    }
    
    function repeater(error) {
      if(error) return complete(error);
      if(counter < data.total_number) {
        paging.cursor = data.next_cursor;
        setTimeout(worker, self.timeout);
      } else {
        complete(null, counter);
      }
    }
  }
}


SinaCrawler.prototype.page_handler = function(id, since_id, max_id, action, callback, complete) {
  var self = this;
  var retry = 3;
  var counter = 0;
  var paging = {count: 100, page: 1};

  if(!callback) {
    if(typeof since_id === 'function') {
      callback = since_id;
      complete = max_id;
    } else if(typeof max_id === 'function') {
      callback = max_id;
      complete = callback;
      if(since_id) paging.since_id = since_id;
    }
  } else {
    if(since_id) paging.since_id = since_id;
    if(max_id) paging.max_id = max_id;
  }

  worker();

  function worker() {
    action(id, paging, handler);
  }

  function handler(error, data) {
    if(error) return complete(error);
    self.pulse += 1;

    for(var x in data) {
      if(Array.isArray(data[x])) {
        if(data[x].length < 1) {
          if(--retry === 0) complete(null, counter);
          else repeater();
        } else {
          counter += data[x].length;
          callback(data[x], repeater);
        }
        break;
      }
    }
    
    function repeater(error) {
      if(error) return complete(error);
      if(counter < data.total_number) {
        paging.page += 1;
        setTimeout(worker, self.timeout);
      } else {
        complete(null, counter);
      }
    }
  }
}


