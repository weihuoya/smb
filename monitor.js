var Db = require('mongodb').Db
  , Server = require('mongodb').Server;

var internalCommands = [
  '_executeQueryCommand', 
  '_executeInsertCommand', 
  '_executeUpdateCommand', 
  '_executeRemoveCommand'
];

var commandMap = {
  '_executeQueryCommand': 'find', 
  '_executeInsertCommand': 'insert', 
  '_executeUpdateCommand': 'update', 
  '_executeRemoveCommand': 'remove'
};

module.exports = function() {
  var proxy = require('./proxy');
  var type = 'MongoDB';

  var collsCount = 0;
  var colls = {};
  var collNameRegex = /[^\.\$]+\.([^\.\$]+)/;
  
  var nt = {
    error: function(error) {
      throw error;
    },
    
    metric: function(conn, label, value, unit, type) {
      console.log('['+conn+']');
      console.log(label+'='+value+'('+unit+')');
    }
  };
  
  proxy.init(nt);
  
  function truncate(args) {
    if(!args) return undefined;

    if(typeof args === 'string') {
      return (args.length > 80 ? (args.substr(0, 80) + '...') : args); 
    }
    
    if(!args.length) return undefined;

    var arr = [];
    var argsLen = (args.length > 10 ? 10 : args.length); 
    for(var i = 0; i < argsLen; i++) {
     if(typeof args[i] === 'string') {
        if(args[i].length > 80) {
          arr.push(args[i].substr(0, 80) + '...'); 
        }
        else {
          arr.push(args[i]); 
        }
      }
      else if(typeof args[i] === 'number') {
        arr.push(args[i]); 
      }
      else if(args[i] === undefined) {
        arr.push('[undefined]');
      }
      else if(args[i] === null) {
        arr.push('[null]');
      }
      else if(typeof args[i] === 'object') {
        arr.push('[object]');
      }
      if(typeof args[i] === 'function') {
        arr.push('[function]');
      }
    } 

    if(argsLen < args.length) arr.push('...');

    return arr;
  };
  
  function monitorCollection(host, port, dbName, collName) {
    var m = collNameRegex.exec(collName);
    if(!m || !m[1]) return;
    collName = m[1];

    var address = host + ':' + port + ':' + dbName + ':' + collName;
    if(colls[address] || ++collsCount > 40) return;

    colls[address] = {
      host: host, 
      port: port, 
      dbName: dbName,
      collName: collName
    };
  }

  function done(mClient, err) {
    try {
      if(mClient) mClient.close()
    }
    catch(err2) {
      nt.error(err2);
    }

    if(err) nt.error(err);      
  }

  function loadStats(coll) {
    var mClient = new Db(
      coll.dbName, 
      new Server(coll.host, coll.port, {'auto_reconnect': false, 'poolSize': 1}), 
      {safe: false}
    );
    
    mClient.open(function(err) {
      if(err) return done(mClient, err);

      try {
        mClient.collection(coll.collName, function(err, collection) {
          if(err) return done(mClient, err);

          try {
            collection.stats(function(err, stats) {
              if(err) return done(mClient, err);
              if(!stats) return done(mClient);

              try {
                function metric(label, key, unit) {
                  var numVal = parseFloat(stats[key]);
                  if(typeof(numVal) !== 'number') return;
                  if(unit === 'KB') numVal /= 1000;
   
                  nt.metric(
                    'MongoDB collection ' + 
                      coll.host + ':' + 
                      coll.port + ':' + 
                      coll.dbName + ':' + 
                      coll.collName,                     
                    label, 
                    numVal, 
                    unit,
                    'gauge');
                }

                metric('Object count' ,'count' , null);
                metric('Collection size' ,'size' , 'KB');
                metric('Average object size' ,'avgObjSize' , 'KB');
                metric('Storage size' ,'storageSize' , 'KB');
                metric('Index size' ,'totalIndexSize' , 'KB');
                metric('Padding factor' ,'paddingFactor' , null);

                done(mClient);
              }
              catch(err) {
                done(mClient, err);
              }
            });
          }
          catch(err) {
            done(mClient, err);
          }
        });
      }
      catch(err) {
        done(mClient, err);
      }
    });
  }

  /*setInterval(function() {
    for(var address in colls) {
      try {
        loadStats(colls[address]);
      }
      catch(err) {
        nt.error(err);
      }
    }
  }, 60000);*/

  internalCommands.forEach(function(internalCommand) {
    proxy.before(Db.prototype, internalCommand, function(obj, args) {
      var command = (args && args.length > 0) ? args[0] : undefined;
      var interval = process.hrtime();

      proxy.callback(args, -1, function(obj, args) {
        interval = process.hrtime(interval);

        var conn = {};
        if(command.db) {
          var servers = command.db.serverConfig;
          if(servers) {
            if(Array.isArray(servers)) {
              conn.servers = [];
              servers.forEach(function(server) {
                conn.servers.push({host: server.host, port: server.port});

                monitorCollection(server.host, server.port, command.db.databaseName, command.collectionName);
              }); 
            }
            else {
              conn.host = servers.host;
              conn.port = servers.port;

              monitorCollection(servers.host, servers.port, command.db.databaseName, command.collectionName);
            }
          }
          
          conn.database = command.db.databaseName;
        }

        var commandName = commandMap[internalCommand];
        var query = command.query ? truncate(JSON.stringify(command.query)) : '{}';
        var error = proxy.getErrorMessage(args);

        /*var sample = {};
        sample['Connection'] = conn;
        sample['Command'] = {
          collectionName: command.collectionName, 
          commandName: commandName, 
          query: query, 
          queryOptions: command.queryOptions, 
          numberToSkip: command.numberToSkip,
          numberToReturn: command.numberToReturn
        };*/
        console.log('[M] '+command.collectionName+'|'+commandName+'|'+query+'|'+command.numberToReturn);
      });
    });
  });
};

