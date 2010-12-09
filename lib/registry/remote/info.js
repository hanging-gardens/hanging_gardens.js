var http = require('http')
;

module.exports = function(name, registry, callback){
  var client
  ,   request
  ;

  registry.port = registry.port || 80;
  registry.host = registry.host || 'registry.npmjs.org';

  client = http.createClient(registry.port, registry.host);

  request = client.request('GET', '/'+name, {'host': registry.host});
  request.end();

  client.on('error', function(err){
    callback(err, undefined);
  });

  request.on('response', function(response){
    var body = ""
    ;

    if (response.statusCode == 200) {
      response.setEncoding('utf8');

      response.on('data', function (chunk){
        body += chunk.toString();
      });

      response.on('error', function(err){
        callback(err, undefined);
      });

      response.on('end', function(){
        body = JSON.parse(body);
        callback(undefined, body.versions);
      });

    } else {
      callback(new Error("Response["+response.statusCode+"]: "+name), undefined);
    }
  });
};