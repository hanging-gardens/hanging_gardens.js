var fs       = require('fs')
,   path     = require('path')
,   resolver = require('../resolver')
,   cacher   = require('../cache')
,   builder  = require('../builder')
,   archiver = require('../archiver')
,   ui       = require('../util/ui')
;

var _load_package
,   _resolve_dependencies
,   _cache_dependecies
,   _build
,   _archive
,   _write_archive
;

var _working
;

exports.run = function(config, path, callback){
  var acc
  ;

  acc =
  { config: config
  , path:   path
  };

  _load_package(acc, callback);
};

exports.watch = function(config, path, callback){
  var acc
  ,   name
  ,   package
  ,   id
  ,   module
  ;

  acc =
  { config: config
  , path:   path
  };

  _load_package(acc, function(err){
    if (err) {
      console.log(err);
    }

    ui.status('Watching for changes');

    for (name in acc.packages) {
      package = acc.packages[name];

      fs.watchFile(package._root + '/package.json', {interval:100}, function(curr, prev){
        if (curr.mtime > prev.mtime){
          exports.watch(config, path, callback);
        }
      });

      for (id in package._modules) {
        module = package._modules[id];

        fs.watchFile(module.path, {interval:100}, function(curr, prev){
          if (curr.mtime > prev.mtime){
            exports.watch(config, path, callback);
          }
        });
      }
    }
  });
};

_load_package = function(acc, callback){
  var package
  ;

  if (_working) return;

  _working = true;

  fs.readFile(acc.path, function(err, data){
    if (err) {
      callback(err);
      return;
    }

    package = JSON.parse(data.toString());
    package._top  = true;
    package._root = path.dirname(acc.path);
    acc.package = package;

    _resolve_dependencies(acc, callback);
  });
};

_resolve_dependencies = function(acc, callback){
  resolver(acc.package, acc.config, function(err, packages){
    if (err) {
      callback(err);
      return;
    }

    acc.packages = packages;

    _cache_dependecies(acc, callback);
  });
};

_cache_dependecies = function(acc, callback){
  cacher.cache(acc.packages, acc.config, function(err, packages){
    if (err) {
      callback(err);
      return;
    }

    acc.packages = packages;

    _build(acc, callback);
  });
};

_build = function(acc, callback){
  builder.build(acc.packages, function(err, packages){
    if (err) {
      callback(err);
      return;
    }

    acc.packages = packages;

    _archive(acc, callback);
  });
};

_archive = function(acc, callback){
  archiver(acc.packages, function(err, archive){
    if (err) {
      callback(err);
      return;
    }

    acc.archive = archive;

    _write_archive(acc, callback);
  });
};

_write_archive = function(acc, callback){
  fs.writeFile(acc.config.output, acc.archive, function(err){
    _working = false;

    if (err) {
      callback(err);
      return;
    }

    ui.status('Done');

    callback(undefined);
  });
};
