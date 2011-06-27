var http = require('http')
,   util = require('util')
,   fs   = require('fs')
;

module.exports = function(package_url, cache_path, callback) {
  var client
  ,   request
  ,   url_path
  ,   url_host
  ,   url_port
  ,   cache_file
  ;

  url_path = package_url.pathname;
  url_host = package_url.hostname;
  url_port = package_url.port;

  client = http.createClient(url_port || 80, url_host);

  request = client.request('GET', url_path, {'host': url_host});
  request.end();

  client.on('error', function(err){
    callback(err);
  });

  request.on('response', function(response){
    if (response.statusCode == 200) {
      cache_file = fs.createWriteStream(cache_path,
                     {'flags':'w+', 'mode':0644});
      response.on('data', function(data){ cache_file.write(data); });
      response.on('error', function(err){
        cache_file.end();
        fs.unlink(cache_path);
        callback(err);
      });
      response.on('end', function(){
        cache_file.end();
        callback(undefined);
      });
    } else {
      callback(new Error("Response["+response.statusCode+"]: "+package_url));
    }
  });
};
