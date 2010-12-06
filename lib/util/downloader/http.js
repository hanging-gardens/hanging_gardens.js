var http = require('http')
,   path = require('path')
,   sys  = require('sys')
,   url  = require('url')
,   fs   = require('fs')
;

module.exports = function(config, package, package_url, callback) {
  var client
  ,   request
  ,   cache_path
  ,   url_path
  ,   url_host
  ,   url_port
  ;

  package_url = url.parse(package_url);
  url_path = package_url.pathname;
  url_host = package_url.hostname;
  url_port = package_url.port;

  cache_path = path.join(config.cache_dir,
    package.name + '-' + package.version + path.extname(url_path));

  client = http.createClient(url_port, url_host);

  request = client.request('GET', url_path, {'host': url_host});
  request.end();

  client.on('error', function(err){
    callback(err, undefined);
  });

  request.on('response', function(response){
    if (response.statusCode == 200) {
      fs.open(cache_path, 'w+', 0644, function(err, cache_file){
        sys.pump(response, cache_file, function(err){
          fs.close(cache_file);

          if (err) {
            fs.unlink(cache_path);
            callback(err, undefined);
            return;
          }

          callback(undefined, cache_path);
        });
      })
    } else {
      callback(new Error("Response["+response.statusCode+"]: "+package_url), undefined);
    }
  });
};
