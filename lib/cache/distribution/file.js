var path  = require('path')
,   spawn = require('child_process').spawn
;

module.exports = function(package_url, cache_path, callback) {
  var package_path
  ;
  
  package_path = package_url.pathname;
  
  path.exists(package_path, function(exists){
    if (!exists) {
      callback(new Error("No file: "+package_path));
      return;
    }

    cp = spawn('cp', ['-r', package_path, cache_path]);
    cp.stdin.end();
    
    cp.on('exit', function (code) {
      if (code > 0) {
        callback(new Error("cp exited with "+code));
        return;
      }

      callback(undefined);
    });
  });
};
