var fs   = require('fs')
,   path = require('path')
;

exports.ensure_path = function(p, callback){
  if (p[0] != '/') {
    fs.realpath(p, function(err, p){
      exports.ensure_path(p, callback);
    });
  } else if (p == '/') {
    callback(undefined);
  } else {
    exports.ensure_path(path.dirname(p), function(err){
      if (err) { callback(err); return; }
      
      path.exists(p, function(exists){
        if (exists) {
          callback(undefined);
        } else {
          fs.mkdir(p, 0755, callback);
        }
      })
    });
  }
};
