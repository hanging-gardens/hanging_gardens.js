var path = require('path')
,   fs   = require('fs')
,   dir  = require('../util/dir')
,   ui   = require('../util/ui')
;

// Private API
var _normalize_package
,   _normalize_library
,   _normalize_application
,   _discover_modules
,   _discover_optional_modules
,   _load
;

module.exports = function(package, callback){
  var acc
  ;

  acc =
  { package: package
  };

  _load(acc, callback);
};

_load = function(acc, callback){
  var package
  ;

  package = acc.package;

  if (package.type && package.type == 'application') {
    _normalize_application(acc, function(err){
      if (err) {
        callback(err, undefined);
        return;
      }

      callback(undefined, acc.package);
    });
  } else {
    _normalize_library(acc, function(err){
      if (err) {
        callback(err, undefined);
        return;
      }


      callback(undefined, acc.package);
    });
  }
};


_normalize_package = function(acc, callback){
  var key
  ,   package
  ;

  package = acc.package;

  if (!package.directories) {
    package.directories = {};
  }

  if (!package.directories.lib) {
    package.directories.lib = './lib';
  }

  package.directories.lib = path.normalize(package.directories.lib);

  if (!package.modules) {
    package.modules = {};
  }

  if (package.main) {
    package.modules['index'] = package.main;
    delete package['main'];
  }

  if (package._root) {
    package._root = path.normalize(package._root);
  }

  fs.stat(path.join(package._root, 'package.json'), function(err, stat){
    if (err) {
      callback(err);
      return;
    }

    package._mtime = stat.mtime;

    callback(undefined);
  });
};

_normalize_library = function(acc, callback){
  _normalize_package(acc, function(err){
    if (err) {
      callback(err);
      return;
    }

    // lookup lib files
    _discover_modules(acc, acc.package.directories.lib, false, callback);
  });
};

_normalize_application = function(acc, callback){
  var discover_behaviours
  ,   discover_helpers
  ,   discover_widgets
  ,   discover_lib
  ;

  discover_behaviours = function(acc){
    var prefix = 'behaviours';
    _discover_optional_modules(acc, prefix, prefix, function(err){
      if (err) {
        callback(err);
        return;
      }

      discover_helpers(acc);
    });
  };

  discover_helpers = function(acc){
    var prefix = 'helpers';
    _discover_optional_modules(acc, prefix, prefix, function(err){
      if (err) {
        callback(err);
        return;
      }

      discover_widgets(acc);
    });
  };

  discover_widgets = function(acc){
    var prefix = 'widgets';
    _discover_optional_modules(acc, prefix, prefix, function(err){
      if (err) {
        callback(err);
        return;
      }

      discover_lib(acc);
    });
  };

  discover_lib = function(acc){
    var prefix = 'lib';
    _discover_optional_modules(acc, prefix, false, function(err){
      if (err) {
        callback(err);
        return;
      }

      callback(undefined);
    });
  };

  _normalize_package(acc, function(err){
    if (err) {
      callback(err);
      return;
    }

    discover_behaviours(acc);
  });
};

_discover_optional_modules = function(acc, lib_dir, prefix, callback){
  path.exists(path.join(acc.package._root, lib_dir), function(exists){
    if (exists) {
      _discover_modules(acc, lib_dir, prefix, callback);
    } else {
      callback(undefined);
    }
  });
};

_discover_modules = function(acc, lib_dir, prefix, callback){
  var mod_path
  ,   package
  ,   idx
  ,   id
  ,   module_ids = {}
  ,   ext
  ;

  package = acc.package;
  package._files = package._files || [];

  dir.read(path.join(package._root, lib_dir), function(err, files){
    if (err) {
      callback(err);
      return;
    }

    for (idx in files) {
      ext = path.extname(files[idx]);
      if (ext == '.js' || ext == '.coffee' || ext == '.node') {
        id = files[idx].
          replace(package._root + '/', '').
          replace(/\.(js|coffee|node)$/, '');
        module_ids[id] = files[idx].
          replace(package._root + '/', '');
      } else {
        delete files[idx];
      }
    }


    // validate modules
    for (id in package.modules) {
      mod_path = path.normalize(package.modules[id]);
      mod_path = mod_path.replace(/\.(js|coffee|node)$/, '');
      package.modules[id] = package.modules[id] || module_ids[mod_path];

      mod_path = path.normalize(path.join(package._root, package.modules[id]));
      idx      = files.indexOf(mod_path);

      if (package._files.indexOf(mod_path) >= 0) {
        false /* ignore */
      } else if (idx < 0) {
        callback(new Error("no module file at path: "+mod_path));
        return;
      } else {
        package._files.push(mod_path);
        delete files[idx];
      }
    }

    // add unregistered modules
    for (idx in files) {
      mod_path = files[idx].replace(package._root + '/', '');
      id   = mod_path.replace(lib_dir+'/', '');
      id   = id.replace(/\.(js|coffee|node)$/, '');
      if (prefix) id = path.join(prefix, id);
      package.modules[id] = package.modules[id] || mod_path;
      package._files.push(files[idx]);
    }

    callback(undefined);
  });
};
