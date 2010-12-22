var fs       = require('fs')
,   path     = require('path')
,   resolver = require('../resolver')
,   cacher   = require('../cache')
,   builder  = require('../builder')
,   ui       = require('../util/ui')
,   watch    = require('watch')
;

var _load_package
,   _resolve_dependencies
,   _cache_dependecies
,   _build
,   _write_archive
,   _watch_project
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

  ui.status('Booted');

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

  ui.status('Booted');

  _watch_project(acc);
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

    ui.status("Loaded "+acc.path);

    _resolve_dependencies(acc, callback);
  });
};

_resolve_dependencies = function(acc, callback){
  resolver(acc.package, acc.config, function(err, packages){
    if (err) {
      callback(err);
      return;
    }

    ui.status("Resolved dependencies");

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

    ui.status("Cached dependencies");

    acc.packages = packages;

    _build(acc, callback);
  });
};

_build = function(acc, callback){
  builder.build(acc.packages, acc.config, function(err, archive){
    if (err) {
      callback(err);
      return;
    }

    ui.status("Cached packages");

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

    ui.puts('[DONE]');
    ui.status(false);

    callback(undefined);
  });
};

_watch_project = function(acc){
  process.on('exit', function(){
    ui.puts('[BYE]');
    ui.status(false);
  });
  
  process.on('SIGINT', function (){
    process.exit(0);
  });
  
  _load_package(acc, function(err){
    if (err) {
      ui.puts('Target was not updated!');
    }

    ui.status('Watching for changes');

    for (name in acc.packages) {
      package = acc.packages[name];

      if (package._top) {
        var opts
        ;

        opts =
        { interval: 500
        };

        watch.watchTree(package._root, opts, function(f, curr, prev){
          // console.log([f, acc.config.output]);
          if (typeof f == "object" && prev === null && curr === null) {
            return;
          } else if (f == acc.config.output) {
            return;
          } else if (f == path.join(package._root, '.gardencache.json')) {
            return;
          } else if (curr.mtime <= prev.mtime) {
            return;
          } else {
            _load_package(acc, function(err){
              if (err) {
                ui.puts('Target was not updated!');
              }

              ui.status('Watching for changes');
            });
          }
        });
      }
    }
  });
};