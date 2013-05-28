var Variety = require('../weibo/variety')
  , Provider = require('../weibo/provider')
  , Weibo = require('../weibo/weibo')
  , Crawler = require('../weibo/crawler')
  , os = require('os')
  , _ = require('../underscore')
  , assert = require('assert');


exports.test = function(weibo) {
  console.log('[test]');
  os_test(function(error, profile) {
    console.log(profile);
  });
  //db_test();
  //weibo_test(weibo);
  //process.exit();
}

function weibo_test(weibo) {
  console.log('[weibo]');
  weibo.getPublicTimeline(function(error, data) {
    if(error) throw error;
    
    console.log('[public]');
    var ids = _.pluck( data.statuses, 'id');
    console.log(ids);
  });
  
}


function crawler_test(weibo) {
  var crawler = new Crawler(weibo);
  
  crawler.getFriendsIds(1725027100, function(data, next) {
    console.log('UID', data);
    next(true);
  }, function(error, count) {
    //if(error) throw error;
    //console.log('count:', count);
  });
  
}


function db_test() {
  var provider = new Provider();
  
  provider.open(function(error) {
  
    /*
    provider.status.stats(10, function(error, data) {
      if(error) throw error;
      if(Array.isArray(data)) {
        data.forEach(function(v) {
          console.log(v);
          provider.status.timeline(v._id, function(error, result) {
            if(error) throw error;
            console.log(result);
          });
        });
      }
    });*/
    
    provider.status.timeline(1725027100, function(error, result) {
      if(error) throw error;
      console.log(result);
    });
    
    /*provider.findPart(1725027100, 100, function(error, data) {
      if(error) throw error;
      console.log('UID:', data);
    });*/
    
  });
}

function os_test(callback) {
  var profile = {
    'hostname': os.hostname(),
    'type': os.type(),
    'platform': os.platform(),
    'arch': os.arch(),
    'release': os.release(),
    'uptime': os.uptime(),
    'totalmem': os.totalmem(),
    'freemem': os.freemem(),
    'node': process.versions.node,
    'mongo': undefined,
    //'cpus': undefined
  },
  variety = new Variety();
  variety.info(function(error, info) {
    if(error) return callback(error);
    profile['mongo'] = info.version;
    //getCPUUsage(function(cpus) {
    //  profile['cpus'] = cpus;
      callback(null, profile);
    //});
  });
}



function getCPUUsage(callback){ 
    var stats1 = getCPUStats();
    setTimeout(function() {
        var i, diff = [], stats2 = getCPUStats();
        for(i = 0; i < stats2.length; ++i) {
          diff[i] = {
            'model': stats2[i].model,
            'idle' : stats2[i].idle  - stats1[i].idle,
            'total': stats2[i].total - stats1[i].total
          };
        }
        callback(diff);
    }, 1000 );
}

function getCPUStats(){ 
  var stats = [], idle = [], total = [], cpus = os.cpus();
  for(var i = 0; i < cpus.length; ++i) {
    stats.push({'model': cpus[i].model, 'idle': cpus[i].times.idle, 'total': 0});
    for(var j in cpus[i].times) {
      stats[i].total += cpus[i].times[j];
    }
  }
  return stats;
}

