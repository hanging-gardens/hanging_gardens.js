var path = require('path')
,   fs   = require('fs')
,   dir  = require('../util/dir')
;

var _verify_files
;

exports.get = function(package, callback){
  var cache_file
  ,   package
  ,   acc
  ,   id
  ,   module
  ,   package_path
  ;

  cache_file = path.join(package._root, '.gardencache.json');
  cache_file = path.normalize(cache_file);
  fs.exists(cache_file, function(exists){
    if (exists) {
      fs.readFile(cache_file, function(err, data){
        if (err) {
          callback(err, undefined);
          return;
        }

        package = JSON.parse(data.toString());

        acc =
        { mtimes : {}
        , queue  : []
        };

        for (id in package._modules) {
          module = package._modules[id];
          acc.mtimes[path.join(package._root, module.path)] = module.mtime;
          acc.queue.push(path.join(package._root, module.path));
        }

        package_path = path.join(package._root, 'package.json');
        acc.mtimes[package_path] = package._mtime;
        acc.queue.push(package_path);

        _verify_files(acc, function(valid){
          if (valid) {
            callback(undefined, package);
          } else {
            callback(undefined, undefined);
          }
        });
      });
    } else {
      callback(undefined, undefined);
    }
  });
};

exports.set = function(package, callback){
  var cache_file
  ,   data
  ;

  cache_file = path.join(package._root, '.gardencache.json');
  data       = JSON.stringify(package);
  fs.writeFile(cache_file, data, function(err){
    if (err) {
      callback(err);
      return;
    }

    callback(undefined);
  });
};

_verify_files = function(acc, callback){
  var file
  ,   mtime
  ,   new_mtime
  ;

  file  = acc.queue.shift();
  mtime = new Date(acc.mtimes[file]).valueOf();

  fs.exists(file, function(exists){
    if (!exists) {
      callback(false);
      return;
    }

    fs.stat(file, function(err, stat){
      if (err) {
        callback(false);
        return;
      }

      new_mtime = new Date(stat.mtime).valueOf();

      if (stat.mtime > mtime) {
        callback(false);
        return;
      }

      if (acc.queue.length > 0) {
        _verify_files(acc, callback);
        return;
      }

      callback(true);
    });
  });
};
