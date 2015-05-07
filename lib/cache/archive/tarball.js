var ui    = require('../../util/ui')
,   dir   = require('../../util/dir')
,   path  = require('path')
,   fs    = require('fs')
,   spawn = require('child_process').spawn
;

module.exports = function(dist_path, cache_path, callback) {
  fs.exists(dist_path, function(exists){
    if (!exists) {
      callback(new Error("No file: "+dist_path));
      return;
    }

    dir.ensure_path(path.dirname(cache_path), function(err){
      if (err) {
        callback(err);
        return;
      }

      cp = spawn('tar', ['xzof', dist_path], { cwd : path.dirname(cache_path) });
      cp.stdin.end();
      cp.stderr.on('data', function(data){ ui.puts(data.toString()); });

      cp.on('exit', function (code) {
        if (code > 0) {
          callback(new Error("tar exited with "+code));
          return;
        }

        fs.rename(path.dirname(cache_path)+'/package', cache_path);

        callback(undefined);
      });
    });
  });
};
