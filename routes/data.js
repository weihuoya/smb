
/*
 * GET users listing.
 */

var Provider = require('../weibo/provider');


var provider = new Provider();
provider.open(function(error, db) {
	if(error) console.log('[W] provider open error: ', error);
});


exports.handler = function(req, res) {
  var type = req.params.type, name = req.params.name, page = req.params.page, extra = req.params.extra;
  
  switch(type) {
    case 'user':
      if(!page) page = name, name = null;
      query(page, name);
      break;
    case 'state':
      state(name);
      break;
    case 'status':
      status(name, page, extra);
      break;
    case 'record':
      if(!page) page = name, name = null;
      record(page, name);
      break;
    case 'cluster':
      cluster(extra, page, name);
      break;
    default:
      res.json(500, {error: 'invalid request'});
      break;
  }
  
  function query(page, user) {
    page = page ? parseInt(page) : 0;
    if(page < 0) page = 0;
    if(typeof user !== 'string') user = '';
    else if(user.length > 64) user = user.substr(0, 64);
    
    provider.user.count(user, function(error, total) {
      var limit = 10;
      if(error) res.json(500, {error: 'user count query error'}), console.log(error);
      provider.user.page(page, limit, user, function(error, data) {
        if(error) res.json(500, {error: 'user page query error'}), console.log(error);
        res.json({users: data, index: page, limit: limit, total: total});
      });
    });
  }
  
  function state(user) {
    user = user ? parseInt(user) : 0;
    if(user < 0) user = 0;
    provider.status.timeline(user, function(error, data) {
      if(error) res.json(500, {error: 'user timeline query error'}), console.log(error);
      res.json( data.map(function(item, index, array) { return [item._id, item.value] }) );
    });
  }
  
  function status(user, since, max) {
    user = user ? parseInt(user) : 0, since = new Date(since), max = new Date(max);
    provider.status.range({uid: user}, 100, since, max, function(error, statuses) {
      if(error) res.json(500, {error: 'status range query error'}), console.log(error);
      res.json(statuses);
    });
  }
  
  function record(page, date) {
    page = page ? parseInt(page) : 0;
    if(page < 0) page = 0;
    
    provider.cluster.record_count(function(error, total) {
      var limit = 10;
      if(error) res.json(500, {error: 'record count query error'}), console.log(error);
      provider.cluster.record_list(page, limit, function(error, data) {
        if(error) res.json(500, {error: 'record page query error'}), console.log(error);
        res.json({records: data, index: page, limit: limit, total: total});
      });
    });
  }
  
  function cluster(page, k, id) {
    page = page ? parseInt(page) : 0;
    if(!page || page < 0) page = 0;
    k = k ? parseInt(k) : 1;
    if(!k || k < 1) k = 1;
    id = id ? parseInt(id) : 0;
    if(!id || id < 0) id = 0;
    
    if(id === 0) res.json(500, {error: 'cluster id error'});
    
    provider.cluster.cluster_count({id: id, k: k}, function(error, total) {
      var limit = 10;
      if(error) res.json(500, {error: 'cluster count query error'}), console.log(error);
      provider.cluster.record_find(id, function(error, rdata) {
        if(error) res.json(500, {error: 'record find query error'}), console.log(error);
        provider.cluster.cluster_page(page, limit, {id: id, k: k}, function(error, cdata) {
          if(error) res.json(500, {error: 'cluster page query error'}), console.log(error);
          res.json({clusters: cdata, k: k, count: rdata.k, index: page, limit: limit, total: total});
        });
      });
    });
  }
  
}
