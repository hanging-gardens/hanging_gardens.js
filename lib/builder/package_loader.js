var path = require('path')
,   fs   = require('fs')
,   ui   = require('../util/ui')
;

// Private API
var _normalize_package
,   _normalize_library
,   _normalize_application
,   _normalize_filename
;

var _find_modules
,   _find_modules_in_dir
,   extentions = ['.js', '.coffee']
;

module.exports = function(package, callback){
  if (package.type && package.type == 'application') {
    package = _normalize_application(package);
  } else {
    package = _normalize_library(package);
  }
  
  callback(undefined, package);
};

_normalize_package = function(package, directories){
  var key
  ,   dir
  ,   stat
  ,   id
  ;

  if (!package.directories) {
    package.directories = {};
  }
  
  for (key in directories) {
    package.directories[key] = 
      path.normalize(package.directories[key] || key);
  }

  if (!package.modules) {
    package.modules = {};
  }

  if (package.main) {
    package.modules['index'] = package.main;
    delete package['main'];
  }

  for (id in package.modules) {
    key = path.normalize(path.join(package.name, id));
    package.modules[key] = path.join(package.name,
      _normalize_filename(package.modules[id], package, directories));
    delete package.modules[id];
  }

  if (package._root) {
    package._root = path.normalize(package._root);
  }

  stat = fs.statSync(path.join(package._root, 'package.json'));
  package._mtime = stat.mtime;
  
  for (idx in directories){
    key = package.directories[idx];
    directories[key] = directories[idx];
    if (key !== idx) {
      delete directories[idx];
    }
  }
  
  return package;
};

_normalize_library = function(package){
  var directories
  ;
  
  directories =
  { 'lib': false
  };
  
  package = _normalize_package(package, directories);
  
  package._modules = _find_modules(package._root, package.name, directories);
  
  return package;
};

_normalize_application = function(package){
  var directories = {}
  ;
  
  directories =
  { 'lib'        : false
  , 'behaviours' : 'behaviours'
  , 'helpers'    : 'helpers'
  , 'widgets'    : 'widgets'
  };
  
  if (!package.main) {
    package.main = "behaviours/index";
  }
  
  package = _normalize_package(package, directories);
  
  package._modules = _find_modules(package._root, package.name, directories);
  
  return package;
};

_find_modules = function(root, global_prefix, directories){
  var dir
  ,   prefix
  ,   map
  ;
  
  map  = {};
  root = path.normalize(root);
  
  for (dir in directories) {
    prefix = directories[dir] || '.';
    prefix = path.normalize(path.join(global_prefix, prefix));
    stat   = null;
    try { stat = fs.statSync(path.join(root, dir)); } catch(e){};
    
    if (stat && stat.isDirectory()) {
      _find_modules_in_dir(root, dir, prefix, '.', map);
    }
  }
  
  return map;
};

_find_modules_in_dir = function(root, dir, prefix, subdir, map){
  var entries
  ,   dirname
  ,   filename
  ,   extname
  ,   basename
  ,   modname
  ,   modid
  ,   relname
  ;
  
  subdir = subdir || '.';
  prefix = prefix || '.';
  map    = map    || {};
  
  dirname = path.normalize(path.join(root, dir, subdir));
  
  fs.readdirSync(dirname).forEach(function(entry){
    if (entry[0] == '.') return;
    
    filename = path.join(dirname, entry);
    extname  = path.extname(filename);
    basename = path.basename(filename);
    modname  = path.basename(basename, extname);
    
    stat = fs.statSync(filename);
    
    if (stat.isDirectory()) {
      _find_modules_in_dir(root, dir, prefix, path.join(subdir, basename), map);
      return;
    }
    
    if ((stat.isFile()) && (extentions.indexOf(extname) >= 0)) {
      relname = path.normalize(path.join(dir,    subdir, basename));
      modid   = path.normalize(path.join(prefix, subdir, modname));
      map[modid] = { id: modid, path: relname };
    }
  });
  
  return map;
};

_normalize_filename = function(filename, package, directories){
  var extname
  ,   dirname
  ,   idx
  ;
  
  extname  = path.extname(filename);
  
  if (extentions.indexOf(extname) >= 0) {
    filename = path.join(path.dirname(filename),
                         path.basename(filename, extname));
  }
  
  filename = path.normalize(filename);
  
  for (idx in package.directories) {
    dirname = package.directories[idx];
    if (filename.indexOf(dirname + '/') == 0) {
      filename = filename.substr(dirname.length + 1);
      if (directories[idx]) {
        filename = path.join(directories[idx], filename);
      }
      break;
    }
  }
  
  return filename;
};
