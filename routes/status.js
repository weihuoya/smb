
/*
 * GET status info.
 */
 
var Variety = require('../weibo/variety')
  //, Metrics = require('../weibo/metrics')
  //, Samples = require('../weibo/samples')
  , os = require('os')
  , variety = new Variety();

exports.handler = function(req, res) {
  var data, 
  count = 10,
  type = req.params.type,
  name = req.params.name,
  page = req.params.page ? parseInt(req.params.page) : 0;
  
  switch(type)
  {
    case 'database':
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
      break;

    case 'robot':
      if(name === 'status') {
        //data = Metrics.status().slice(page * count, count);
        res.json(data);
      } else if(name === 'user') {
        data = Metrics.user().slice(page * count, count);
        res.json(data);
      }
      break;
    
    case 'crawler':
      //data = Samples.get().slice(page * count, count);
      res.json(data);
      break;
      
    case 'weibo':
      if(name === 'user') {
        res.json({weibo: name});
      } else if(name === 'status') {
        res.json({weibo: name});
      } else if(name === 'comment') {
        res.json({weibo: name});
      }
      break;
      
    case 'sys':
      getSysStatus(function(error, profile) {
        if(error) {
            console.log(error);
            res.json(500, {error: 'system status'});
          } else {
            res.json(profile);
          }
      });
      break;
    
    case 'cpu':
      getCPUUsage(function(error, cpus) { 
        if(error) {
            console.log(error);
            res.json(500, {error: 'cpu status'});
          } else {
            res.json(cpus);
          }
      });
      break;
      
    default:
      res.json(500, {error: 'invalid request'});
      break;
  }
}

function getSysStatus(callback) {
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
    'mongo': undefined
  };
  variety.info(function(error, info) {
    if(error) return callback(error);
    profile['mongo'] = info.version;
      callback(null, profile);
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
    callback(null, diff);
  }, 1000 );
    
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
}