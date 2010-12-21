var path = require('path')
,   fs   = require('fs')
;

var _read_package_files
,   _find_package_file
;

module.exports = function(name, registry, callback){
  var entry_path
  ,   acc
  ;

  entry_path = path.join(registry.path, name);

  fs.realpath(entry_path, function(err, entry_path){
    if (err) {
      callback(undefined, {});
      return;
    }
    
    acc =
    { entry_path:    entry_path
    , versions:      {}
    };
    
    _read_package_files(acc, callback);
  });
};

_read_package_files = function(acc, callback){
  var package_json
  ,   alts
  ,   package
  ;


  alts = ['package/package.json', 'package.json'];
  _find_package_file(acc.entry_path, alts, function(err, package_json){
    if (err) {
      callback(undefined, {});
      return;
    }
  
    fs.readFile(package_json, function(err, data){
      if (err) {
        callback(undefined, {});
        return;
      }
  
      package = JSON.parse(data.toString());
      
      if (!package.dist) { package.dist = {}; }
      package.dist['bare'] = 'file://'+path.dirname(package_json);
      
      acc.versions[package.version || '0.0.0'] = package;
      callback(undefined, acc.versions);
    });
  });
};

_find_package_file = function(root, alternatives, callback){
  var alternative
  ;

  if (alternatives.length == 0) {
    callback(new Error('package.json found in '+ root), undefined);
    return;
  }

  alternative = alternatives.shift();
  if (!alternative) {
    _find_package_file(root, alternatives, callback);
    return;
  }

  alternative = path.join(root, alternative);
  fs.stat(alternative, function(err, stat){
    if (err) {
      _find_package_file(root, alternatives, callback);
      return;
    }

    if (!stat.isFile()) {
      _find_package_file(root, alternatives, callback);
      return;
    }

    callback(undefined, alternative);
  });
};
