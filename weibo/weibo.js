var HttpClient = require('./http'),
    QueryString= require('querystring'),
    URL = require('url');
    //Samples = require('./samples');

module.exports = Weibo;

var SinaURL = 'https://api.weibo.com/2/';
var SinaAPI = {
  //count, callback
  'getPublicTimeline': {
    api: 'statuses/public_timeline.json', 
    candy: function(args) {
      if(args.length > 1) return {count: args[0]}
    }
  },
  
  //args[0] = user, args[1] = params, args[2] = callback
  //user, paging(since_id, max_id, count, page), callback
  'getHomeTimeline': {
    api: 'statuses/home_timeline.json',
    candy: function(args) {
      if(args.length === 1) return;
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }  
  },
  
  //paging(since_id, max_id, count, page), callback
  'getFriendsTimeline': {
    api: 'statuses/friends_timeline.json',
    candy: function(args) {
      if(args.length > 1) return args[0];
    }
  },
  
  //paging(since_id, max_id, count, page), callback
  'getFriendsTimelineIds': {
    api: 'statuses/friends_timeline/ids.json',
    candy: function(args) {
      if(args.length > 1) return args[0];
    }
  },
  
  //user, paging(since_id, max_id, count, page), callback
  'getUserTimeline': {
    api: 'statuses/user_timeline.json',
    candy: function(args) {
      if(args.length === 1) return;
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }    
  },
  
  //user, paging(since_id, max_id, count, page), callback
  'getUserTimelineIds': {
    api: 'statuses/user_timeline/ids.json',
    candy: function(args) {
      if(args.length === 1) return;
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //sid, paging(since_id, max_id, count, page), callback
  'getRepostTimeline': {
    api: 'statuses/repost_timeline.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      params.id = args[0];
      return params;
    }
  },
  
  //sid, paging(since_id, max_id, count, page), callback
  'getRepostTimelineIds': {
    api: 'statuses/repost_timeline/ids.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      params.id = args[0];
      return params;
    }
  },
  
  //paging(since_id, max_id, count, page), callback
  'getMentions': {
    api: 'statuses/mentions.json',
    candy: function(args) { if(args.length === 2) return args[0]; }
  },
  
  //paging(since_id, max_id, count, page), callback
  'getMentionsIds': {
    api: 'statuses/mentions/ids.json',
    candy: function(args) { if(args.length === 2) return args[0]; }
  },
  
  //callback
  'getBilateralTimeline': { api: 'statuses/bilateral_timeline.json', },
  
  //sid, callback
  'showStatus': { api: 'statuses/show.json' },
  
  //user, callback
  'getUser': {
    api: 'users/show.json',
    candy: function(args) {
      var params = {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //uids, callback
  'getUserCount': {
    api: 'users/counts.json',
    candy: function(args) {
      if( !Array.isArray(args[0]) ) { args[0] = [ args[0] ]; }
      args[0] = args[0].join(',');
      return {uids: args[0]};
    }
  },
  
  //uids, callback
  'getTagsBatch': {
    api: 'tags/tags_batch.json',
    candy: function(args) {
      if( !Array.isArray(args[0]) ) { args[0] = [ args[0] ]; }
      args[0] = args[0].join(',');
      return {uids: args[0]};
    }
  },
  
  //uid, callback
  'getUserRank': {
    api: 'users/show_rank',
    candy: function(args) { return {uid: args[0]}; }
  },
  
  //sid, paging(since_id, max_id, count, page), callback
  'getComment': {
    api: 'comments/show.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      params.id = args[0];
      return params;
    }
  },
  
  //user, paging(count, cursor), callback
  'getFriends': {
    api: 'friendships/friends.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //user, paging(count, cursor), callback
  'getFriendsIds': {
    api: 'friendships/friends/ids.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //user, paging(count, cursor), callback
  'getFollowers': {
    api: 'friendships/followers.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //user, paging(count, cursor), callback
  'getFollowersIds': {
    api: 'friendships/followers/ids.json',
    candy: function(args) {
      var params = args.length === 3 ? args[1] : {};
      if(typeof args[0] === 'number')
        params.uid = args[0];
      else if(typeof args[0] === 'string')
        params.screen_name = args[0];
      return params;
    }
  },
  
  //callback
  'getUid': { api: 'account/get_uid.json' },
  
  //callback
  'getRateLimitStatus': { api: 'account/rate_limit_status.json' }
};


function Weibo(debug) {
  var self = this;
  this.client = new HttpClient();

  if(debug) {
    this.client['get'] = hook(this.client['get']);
    this.client['post'] = hook(this.client['post']);
  }

  for(var key in SinaAPI) this[key] = handler(key);
  
  function handler(key) {
    return function() {
      var params;
      if(SinaAPI[key].candy) params = SinaAPI[key].candy(arguments);
      self.client.get(SinaURL+SinaAPI[key].api, params, arguments[arguments.length-1]);
    }
  }
}


Weibo.prototype.setAccessToken= function ( token ) {
  this.client.setToken(token);
}


Weibo.prototype.authenticate = function(redirect, callback) {
  var self = this;

  var sina = {
    auth: 'https://api.weibo.com/oauth2/authorize',
    token: 'https://api.weibo.com/oauth2/access_token'
  };
  
  var tencent = {
    auth: 'https://open.t.qq.com/cgi-bin/oauth2/authorize',
    token: 'https://open.t.qq.com/cgi-bin/oauth2/access_token'
  };
  
  var app = {
    id: '2191887514', 
    secret: 'bd04a1ffc83d07151db417d8257005fc',
    callback: 'http://127.0.0.1:3000/auth/weibo/callback'
  };

  return authHandler(
    app.id, app.secret, app.callback, 
    sina.auth, sina.token, 
    null, redirect, function(error, data) {
      if(error) return callback(error);
      self.setAccessToken(data['access_token']);
      data.uid = parseInt(data.uid);
      callback(null, data);
  });
}


function authHandler(app_id, app_secret, callback_url, auth_url, token_url, oauth_scope, actions, callback) {
  return express_handler;

  function express_handler(req, res, next) {
    if (req.query && req.query.error) return callback(req.query.error);
    
    if (callback_url && !URL.parse(callback_url).protocol ) {
      var base = (req.connection.encrypted || req.headers['x-forwarded-proto'] == 'https') ? 'https' : 'http';
      base = base + '://' + req.headers.host + (req.url || '');
      callback_url = URL.resolve( base, callback_url );
    }

    var params = {
      redirect_uri: callback_url,
      client_id: app_id,
      type: 'web_server'
    };

    if (req.query && req.query.code) {
      //获取token
      var headers = {
        'ContentCharset': 'UTF-8',
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      var client = new HttpClient();
      params.client_secret = app_secret;
      params.code = req.query.code;
      params.grant_type = 'authorization_code';

      client.request('POST', token_url, headers, QueryString.stringify(params), null, handler);
      
      function handler(error, data, response) {
        if(error) {
          callback(error);
          if(actions.failureRedirect) {
            res.redirect(actions.failureRedirect);
          } else  {
            next(error);
          }
        } else {
          callback(null, data, response);
          if(actions.successRedirect) {
            res.redirect(actions.successRedirect);
          } else  {
            next(error);
          }
        }
      }
    } else {
      //跳转到认证页面
      if (oauth_scope) {
        if( Array.isArray(oauth_scope) ) {
          oauth_scope = oauth_scope.join(' '); 
        }
        params.scope = oauth_scope;
      }
      params.response_type = 'code';
      res.redirect(auth_url+'?'+QueryString.stringify(params));
    }
  }
}


function hook(method) {
  return function() {
    var api = arguments[0];
    var last = arguments.length-1;
    
    var params = arguments[last-1];
    var callback = arguments[last];
    
    var interval = process.hrtime();
    
    arguments[last] = function(error, result) {
      if(error) return callback(error);
      var sample;
      interval = process.hrtime(interval);
      sample = takeSample(api, result);
      sample.params = params;
      sample.time = interval;
      //Samples.add(sample);
      
      callback(null, result);
    };
    return method.apply(this, arguments);
  }
}


function takeSample(api, data) {
  var actions = api.substr(SinaURL.length, api.lastIndexOf('.')).split('/');
  var metrics = {};
  var sample = {
    type: actions[0],
    label: actions[1],
    ids: actions[actions.length-1] === 'ids'
  };

  if(actions[0] === 'users' && actions[1] !== 'counts') {
    if(actions[1] === 'show_rank') {
      metrics = data;
    } else {
      metrics.id = data.id;
      metrics.screen_name = data.screen_name;
      metrics.followers_count = data.followers_count;
      metrics.friends_count = data.friends_count;
      metrics.statuses_count = data.statuses_count;
      metrics.favourites_count = data.favourites_count;
      metrics.bi_followers_count = data.bi_followers_count;
    }
  } else if(actions[0] === 'account' && actions[1] !== 'school_list') {
    if(actions[1] !== 'end_session') metrics = data;
  } else {
    for(var i in data) {
      if(Array.isArray(data[i])) {
        metrics.count = data[i].length;
      } else {
        metrics[i] = data[i];
      }
    }
  }

  sample.metrics = metrics;
  return sample;
}

