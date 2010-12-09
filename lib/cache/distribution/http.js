var http = require('http')
,   sys  = require('sys')
,   fs   = require('fs')
;

module.exports = function(package_url, cache_path, callback) {
  var client
  ,   request
  ,   url_path
  ,   url_host
  ,   url_port
  ;

  url_path = package_url.pathname;
  url_host = package_url.hostname;
  url_port = package_url.port;

  client = http.createClient(url_port, url_host);

  request = client.request('GET', url_path, {'host': url_host});
  request.end();

  client.on('error', function(err){
    callback(err);
  });

  request.on('response', function(response){
    if (response.statusCode == 200) {
      fs.open(cache_path, 'w+', 0644, function(err, cache_file){
        sys.pump(response, cache_file, function(err){
          fs.close(cache_file);

          if (err) {
            fs.unlink(cache_path);
            callback(err);
            return;
          }

          callback(undefined);
        });
      })
    } else {
      callback(new Error("Response["+response.statusCode+"]: "+package_url));
    }
  });
};
