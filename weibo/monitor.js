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
  var collsCount = 0;
  var colls = {};
  var collNameRegex = /[^\.\$]+\.([^\.\$]+)/;
  
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

        /*
        sample['Connection'] = conn;
        sample['Command'] = {
          collectionName: command.collectionName, 
          commandName: commandName, 
          query: query, 
          queryOptions: command.queryOptions, 
          numberToSkip: command.numberToSkip,
          numberToReturn: command.numberToReturn
        };
        */
        console.log('[M] '+command.collectionName+'|'+commandName+'|'+query+'|'+command.numberToReturn);
      });
    });
  });
};

