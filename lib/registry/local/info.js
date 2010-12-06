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

  fs.readdir(entry_path, function(err, files){
    if (err) {
      callback(err, undefined);
    }

    acc =
    { version_queue: files
    , entry_path:    entry_path
    , versions:      {}
    };

    _read_package_files(acc, callback);
  });
};

_read_package_files = function(acc, callback){
  var ver
  ,   ver_path
  ,   package_json
  ,   alts
  ,   package
  ;

  if (acc.version_queue.length == 0) {
    callback(undefined, acc.versions);
    return;
  }

  ver = acc.version_queue.shift();
  if (!ver) {
    _read_package_files(acc, callback);
    return;
  }

  ver_path          = path.join(acc.entry_path, ver);

  fs.stat(ver_path, function(err, stat){
    if (err) {
      _read_package_files(acc, callback);
      return;
    }

    if (!stat.isDirectory()) {
      _read_package_files(acc, callback);
      return;
    }

    alts = ['package/package.json', 'package.json'];
    _find_package_file(ver_path, alts, function(err, package_json){
      if (err) {
        _read_package_files(acc, callback);
        return;
      }

      fs.readFile(package_json, function(err, data){
        if (err) {
          _read_package_files(acc, callback);
          return;
        }

        package = JSON.parse(data.toString());
        acc.versions[ver] = package;
        _read_package_files(acc, callback);
      });
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
