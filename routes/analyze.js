


var addons = require('../lib/smb.node');


var smb = new addons.SMB();

smb.initialize(__dirname+'\\..\\lib\\config.json', function(error) {
  if(error) console.log('[W] smb initialize error: ', error);
});

exports.handler = function(req, res) {
  var type = req.params.type, name = req.params.name, page = req.params.page;
  if(type === 'cluster') {
    name = new Date(name), page = new Date(page);
    smb.analyze(name, page, function(error) {
      if(error) console.log('[W] smb initialize error: ', error);
    });
    res.json({msg: 'smb start analyze data', date_start: name, date_end: page});
  }
}