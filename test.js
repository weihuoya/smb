var Variety = require('./variety')
  , _ = require('./underscore')
  , Provider = require('./weibo/provider')
  , Weibo = require('./weibo/weibo')
  , Crawler = require('./weibo/crawler')
  , assert = require('assert');


exports.test = function(weibo) {
  console.log('[test]');
  //db_test();
  weibo_test(weibo);
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
  this.crawler = new Crawler(weibo);
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
    
    provider.status.timeline(2503329332, function(error, result) {
      if(error) throw error;
      console.log(result);
    });
  });
}




