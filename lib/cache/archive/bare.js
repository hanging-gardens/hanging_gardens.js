var path  = require('path')
,   spawn = require('child_process').spawn
,   fs    = require('fs')
;

module.exports = function(dist_path, cache_path, callback) {
  fs.exists(dist_path, function(exists){
    if (!exists) {
      callback(new Error("No file: "+dist_path));
      return;
    }

    cp = spawn('cp', ['-r', dist_path, cache_path]);
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
