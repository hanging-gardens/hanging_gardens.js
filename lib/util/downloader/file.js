var path  = require('path')
,   spawn = require('child_process').spawn
;

module.exports = function(config, package, package_path, callback) {
  var cache_path
  ;

  cache_path = path.join(config.cache_dir,
    package.name + '-' + package.version + path.extname(package_path));

  path.exists(function(exists){
    if (!exists) {
      callback(new Error("No file: "+package_path), undefined);
      return;
    }

    cp = spawn('cp', ['-r', package_path, cache_path]);
    cp.stdin.end();
    cp.on('exit', function (code) {
      if (code > 0) {
        callback(new Error("cp exited with "+code), undefined);
        return;
      }

      callback(undefined, cache_path);
    });
  });
};
