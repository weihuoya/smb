
/*
 * GET status info.
 */
 
var Variety = require('../weibo/variety')
  , Provider = require('../weibo/provider')
  , Metrics = require('../weibo/metrics')
  , Samples = require('../weibo/samples')
  , os = require('os');

var variety = new Variety();
var provider = new Provider();

exports.handler = function(req, res) {
  var data, 
  count = 10,
  type = req.params.type,
  name = req.params.name,
  page = req.params.page ? parseInt(req.params.page) : 0;
  
  if(type === 'database') {
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
  } else if(type === 'robot') {
    if(name === 'status') {
      data = Metrics.status().slice(page * count, count);
      res.json(data);
    } else if(name === 'user') {
      data = Metrics.user().slice(page * count, count);
      res.json(data);
    }
  } else if(type === 'crawler') {
    data = Samples.get().slice(page * count, count);
    res.json(data);
  } else if(type === 'weibo') {
    if(name === 'user') {
      res.json({weibo: name});
    } else if(name === 'status') {
      res.json({weibo: name});
    } else if(name === 'comment') {
      res.json({weibo: name});
    }
  } else if(type === 'sys') {
    variety.info(function(error, info) {
      if(error) {
          console.log(error);
          res.json(500, {error: 'database info'});
        } else {
          var data = {
            node: process.version, 
            mongo: info.version,
            os: os.type(), 
            platform: os.platform(), 
            arch: os.arch(), 
            release: os.release()
          };
          res.json(data);
        }
    });
  }
}

