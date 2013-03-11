
/*
 * GET status info.
 */
 
var Variety = require('../variety')
  , Provider = require('../weibo/provider')
  , Metrics = require('../metrics')
  , Samples = require('../samples');

var variety = new Variety();
var provider = new Provider();

exports.handler = function(req, res) {
  var count = 10;
  var type = req.params.type;
  var name = req.params.name;
  var page = req.params.page ? parseInt(req.params.page) : 0;
  
  if(req.params.type === 'database') {
    if(!name) {
      variety.list(function(error, data) {
        if(error) {
          console.log(error);
          res.json(500, {error: 'database list'});
        } else {
          res.json(data.databases);
        }
      });
    } else {
      variety.stats(name, function(error, data) {
        if(error) {
          console.log(error);
          res.json(500, {error: 'database stats'});
        } else {
          res.json(data);
        }
      });
    }
  } else if(req.params.type === 'robot') {
    if(name === 'status') {
      var data = Metrics.status().slice(page * count, count);
      res.json(data);
    } else if(name === 'user') {
      var data = Metrics.user().slice(page * count, count);
      res.json(data);
    }
  } else if(req.params.type === 'crawler') {
    var data = Samples.get().slice(page * count, count);
    res.json(data);
  } else if(req.params.type === 'weibo') {
    if(name === 'user') {
      res.json({weibo: name});
    } else if(name === 'status') {
      res.json({weibo: name});
    } else if(name === 'comment') {
      res.json({weibo: name});
    }
  }
}

/*
exports.list = function(req, res){
  variety.list(function(error, data) {
    if(error) console.log(error);
    else res.send(JSON.stringify(data.databases));
  });
}

exports.stats = function(req, res){
  var name = req.params.name;
  variety.stats(name, function(error, data) {
    if(error) console.log(error);
    else res.send(JSON.stringify(data));
  });
}

exports.status = function(req, res) {
  var count = 10;
  var page = req.params.page ? parseInt(req.params.page) : 0;
  var data = Metrics.status().slice(page * count, count);
  res.send(JSON.stringify(data));
}

exports.user = function(req, res) {
  var count = 10;
  var page = req.params.page ? parseInt(req.params.page) : 0;
  var data = Metrics.user().slice(page * count, count);
  res.send(JSON.stringify(data));
}

exports.crawler = function(req, res) {
  var count = 10;
  var page = req.params.page ? parseInt(req.params.page) : 0;
  var data = Samples.get().slice(page * count, count);
  res.send(JSON.stringify(data));
}

/*
exports.weibo = function(req, res) {
  provider.user.findPart(10, function(error, users) {
    for(var i = 0; i < users.length; ++i) {
      provider.friend.count(users[i].id, function(error, count) {
        provider.follower.count(users[i].id, function(error, count) {
          provider.status.count({uid: users[i].id}, function(error, count) {
            
          });
        });
      });
    }
  });

  provider.user.count(function(error, count) {
  });
  
  provider.friend.stats(10, function(error, stats) {
    for(var i = 0; i < stats.length; ++i) {
      provider.user.find(stats[i]._id, function(error, user) {
        stats[i].total = user.friend_count;
      });
    }
  });
  
  provider.follower.stats(10, function(error, stats) {
    for(var i = 0; i < stats.length; ++i) {
      provider.user.find(stats[i]._id, function(error, user) {
        stats[i].total = user.follower_count;
      });
    }
  });
  
  provider.status.stats(10, function(error, stats) {
    for(var i = 0; i < stats.length; ++i) {
      provider.user.find(stats[i]._id, function(error, user) {
        stats[i].total = user.status_count;
      });
    }
  });
  
  provider.comment.stats(10, function(error, stats) {
    for(var i = 0; i < stats.length; ++i) {
      provider.status.find(stats[i]._id, function(error, status) {
        stats[i].total = status.comment_count;
      });
    }
  });

}*/
