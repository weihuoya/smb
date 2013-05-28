
/*
 * GET users listing.
  
  /user/state/xxx
  /user/query/xxx/xxx
 
 */

var Provider = require('../weibo/provider');

var provider = new Provider();
provider.open(function(error, db) {
	if(error) console.log("[W] provider open error: ", error);
});

exports.handler = function(req, res) {
  var type = req.params.type, name = req.params.name, page = req.params.page,
  query = function(page, user) {
    page = page ? parseInt(page) : 0;
    if(user && user.length > 64) user = user.substr(0, 64);
    provider.user.count(user, function(error, total) {
      var limit = 10;
      if(error) res.json(500, {error: 'user count query error'}), console.log(error);
      provider.user.page(page, limit, user, function(error, data) {
        if(error) res.json(500, {error: 'user page query error'}), console.log(error);
        res.json({users: data, index: page, limit: limit, total: total});
      });
    });
  }, state = function(user) {
    user = user ? parseInt(user) : 0;
    provider.status.timeline(user, function(error, data) {
      if(error) res.json(500, {error: 'user timeline query error'}), console.log(error);
      res.json( data.map(function(item, index, array) { return [item._id, item.value] }) );
    });
  };
  
  if(type === 'query' && name && page) {
    query(page, name);
  } else if(type && name) {
    if(type === 'query') {
      query(null, name);
    } else if(type === 'state') {
      state(name);
    }
  } else {
    query(type);
  }
}

exports.list = function(req, res){
  res.render('user');
}