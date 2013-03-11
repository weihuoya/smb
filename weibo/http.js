var querystring= require('querystring'),
    crypto= require('crypto'),
    https= require('https'),
    http= require('http'),
    URL= require('url'),
    zlib = require('zlib');

module.exports = HttpClient;

function HttpClient(token) {
  this._token = token;
}

HttpClient.prototype.setToken = function(token) {
  this._token = token;
}


HttpClient.prototype.get = function(url, params, callback) {
  if( !this._token ) throw new Error('access token not set');
  
  var params = params || {};

  var query = this.encodeParameters(params);
  if(query.length > 0) {
    if(-1 == url.indexOf('?')) {
      url += '?';
    } else {
      url += '&';
    }
    url += query;
  }
  
  this.request('GET', url, null, null, this._token, callback);
}

HttpClient.prototype.post = function(url, headers, params, callback) {
  if( !this._token ) throw new Error('access token not set');
  
  var self = this;
  headers['ContentCharset'] = 'UTF-8';
  headers['Content-Encoding'] = 'gzip';
  
  zlib.gzip(params, function(error, content) {
    if(error) return callback(error);
    self.request('POST', url, headers, content, self._token, callback);
  });
}

/**
 * callback(error, result, response)
**/
HttpClient.prototype.request= function(method, url, headers, content, token, callback) {
  var result= '';
  var realHeaders= {};
  var http_library= https;
  var callbackCalled= false;
  var creds = crypto.createCredentials({});
  var parsedUrl= URL.parse(url, true);
  var allowEarlyClose= parsedUrl.hostname ? parsedUrl.hostname.match('.*google(apis)?.com$') : false;
  
  if( parsedUrl.protocol != 'https:' ) {
    http_library = http;
  } else if( !parsedUrl.port ) {
    parsedUrl.port = 443;
  }

  if( headers ) {
    for(var key in headers) {
      realHeaders[key] = headers[key];
    }
  }
  realHeaders['Host']= parsedUrl.host;
  realHeaders['Accept-Encoding']= 'deflate, gzip, identity, *;q=0';
  realHeaders['TE']= 'deflate, gzip, chunked, identity, trailers';

  if( method == 'POST' ) {
    realHeaders['Content-Length']= content ? Buffer.byteLength(content) : 0;
  }
  
  if( token ) {
    if( ! parsedUrl.query ) parsedUrl.query= {};
    parsedUrl.query['access_token']= token;
  }
  var queryStr= querystring.stringify(parsedUrl.query);
  if( queryStr ) queryStr=  '?' + queryStr;
  var options = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + queryStr,
    method: method,
    headers: realHeaders
  };

  var request = http_library.request(options, function (response) {
    var stream = response;
    var encoding = response.headers['content-encoding'];
    if(encoding === 'gzip') {
      var gzip = zlib.createGunzip();
      response.pipe(gzip);
      stream = gzip;
    } else if(encoding === 'deflate') {
      var inflate = zlib.createInflate();
      response.pipe(inflate);
      stream = inflate;
    }
    stream.on('data', function (chunk) {
      result+= chunk 
    });
    stream.on('close', function (err) {
      if( allowEarlyClose ) passBackControl( response, result );
    });
    stream.addListener('end', function () {
      passBackControl( response, result );
    });
  });

  if( method == 'POST' && content ) {
     request.write(content);
  }

  request.on('error', function(e) {
    callbackCalled= true;
    callback(e);
  });

  request.end();

  function passBackControl( response, result ) {
    if(callbackCalled) return;
    callbackCalled = true;
    if( response.statusCode != 200 && (response.statusCode != 301) && (response.statusCode != 302) ) {
      callback({ statusCode: response.statusCode, data: result });
    } else {
      var data;
      try { data = JSON.parse( result ); }
      catch(e) { data = querystring.parse( result ); }
      callback(null, data, response);
    }
  }

}

HttpClient.prototype.encodeParameters = function(params) {
  var query = '';
  for(var key in params) {
    query += encodeURIComponent(key);
    query += '=';
    query += encodeURIComponent( params[key] );
    query += '&';
  }
  return query.substr(0, query.length-1);
}

