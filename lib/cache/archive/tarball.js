var dir   = require('../../util/dir')
,   path  = require('path')
,   spawn = require('child_process').spawn
;

module.exports = function(dist_path, cache_path, callback) {
  path.exists(dist_path, function(exists){
    if (!exists) {
      callback(new Error("No file: "+dist_path));
      return;
    }
    
    dir.ensure_path(cache_path, function(){
      if (err) {
        callback(err);
        return;
      }

      cp = spawn('tar', ['xzf', dist_path], { cwd : cache_path });
      cp.stdin.end();
      
      cp.on('exit', function (code) {
        if (code > 0) {
          callback(new Error("tar exited with "+code));
          return;
        }
      
        callback(undefined);
      });
    });
  });
};
