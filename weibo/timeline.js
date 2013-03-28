
var SinaProvider = require('./provider')
  , SinaCrawler = require('./crawler')
  , Weibo = require('./weibo')
  , async = require('asyncjs');
  
module.exports = Timeline;

function Timeline(weibo) {
  this.weibo = weibo;
}

Timeline.prototype.run(callback) {
}

