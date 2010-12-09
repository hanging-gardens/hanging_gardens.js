var fs   = require('fs')
,   path = require('path')
;

var _read
;

exports.read = function(dir, callback){
  _read(callback, { files: [], queue: [dir] });
};

_read = function(callback, ctx){
  var p
  ,   i
  ;

  if (ctx.queue.length == 0) {
    callback(undefined, ctx.files);
    return;
  }

  p = ctx.queue.shift();

  if (p == undefined) {
    _deepRead(callback, ctx);
  }

  fs.stat(p, function(err, stat){
    if (err) {
      callback(err, undefined);
      return;
    }

    if (stat.isFile()) {
      ctx.files.push(p);
      _read(callback, ctx);
    } else if (stat.isDirectory()) {
      fs.readdir(p, function(err, files){
        if (err) {
          callback(err, undefined);
          return;
        }

        for (i in files) {
          files[i] = path.join(p, files[i]);
        }

        ctx.queue = ctx.queue.concat(files);
        _read(callback, ctx);
      });
    } else {
      _read(callback, ctx);
    }
  });
};

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
