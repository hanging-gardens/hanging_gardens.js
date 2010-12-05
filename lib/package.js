var Path = require('path')
,   fs   = require('fs')
,   dir  = require('./dir')
;

// Private API
var normalize_library
,   normalize_application
,   discover_modules
;

exports.load = function(path, callback){
  fs.realpath(path, function(err, path){
    if (err) {
      callback(err, undefined);
      return;
    }

    fs.readFile(path, function(err, data){
      if (err) {
        callback(err, undefined);
        return;
      }

      data = JSON.parse(data.toString());
      data.root = Path.dirname(path);

      if (data.type && data.type == 'application') {
        normalize_application(data, callback);
      } else {
        normalize_library(data, callback);
      }
    });
  });
};


exports.process = function(package, callback){



};


normalize_library = function(package, callback){
  if (!package.directories) {
    package.directories = {};
  }

  if (!package.directories.lib) {
    package.directories.lib = './lib';
  }

  package.directories.lib = Path.normalize(package.directories.lib);

  if (!package.modules) {
    package.modules = {};
  }

  if (package.main) {
    package.modules['index'] = package.main;
  }

  // lookup lib files
  discover_modules(package, package.directories.lib, false, callback);
};

normalize_application = function(package, callback){
  if (!package.directories) {
    package.directories = {};
  }

  if (!package.modules) {
    package.modules = {};
  }

  if (package.main) {
    package.modules['index'] = package.main;
  }

  // lookup lib files
  discover_optional_modules(package, 'behaviours', 'behaviours',
    function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    discover_optional_modules(package, 'helpers', 'helpers',
      function(err, package){
      if (err) {
        callback(err, undefined);
        return;
      }

      discover_optional_modules(package, 'widgets', 'widgets', callback);
    });
  });
};

discover_optional_modules = function(package, lib_dir, prefix, callback){
  Path.exists(Path.join(package.root, lib_dir), function(exists){
    if (exists) {
      discover_modules(package, lib_dir, prefix, callback);
    } else {
      callback(undefined, package);
    }
  });
};

discover_modules = function(package, lib_dir, prefix, callback){
  var path
  ,   idx
  ,   id
  ;

  dir.read(Path.join(package.root, lib_dir), function(err, files){
    var module_ids = {}
    ;

    if (err) {
      callback(err, undefined);
      return;
    }

    for (idx in files) {
      id = files[idx].
        replace(package.root + '/', '').
        replace(/\.(js|coffee)$/, '');
      module_ids[id] = files[idx].
        replace(package.root + '/', '');
    }

    // validate modules
    for (id in package.modules) {
      path = Path.normalize(package.modules[id]);
      path = path.replace(/\.(js|coffee)$/, '');
      package.modules[id] = module_ids[path];

      path = Path.normalize(Path.join(package.root, package.modules[id]));
      idx  = files.indexOf(path);
      if (idx < 0) {
        throw("no module file at path: "+path);
      } else {
        delete files[idx];
      }
    }

    // add unregistered modules
    for (idx in files) {
      path = files[idx].replace(package.root + '/', '');
      id   = path.replace(lib_dir+'/', '');
      id   = id.replace(/\.(js|coffee)$/, '');
      if (prefix) id = Path.join(prefix, id);
      package.modules[id] = path;
    }

    callback(undefined, package);
  });
};
