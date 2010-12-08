var fs   = require('fs')
,   path = require('path')
;

var _reenter
,   _load_module
;

module.exports = function(package, callback){
  var acc
  ,   id
  ;

  acc =
  { package: package
  , queue:   []
  };

  acc.package._modules = {};

  for (id in package.modules) {
    acc.queue.push(id);
  }

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (acc.queue.length > 0) {
    _load_module(acc, callback);
  } else {
    callback(undefined, acc.package);
  }
};

_load_module = function(acc, callback){
  var id
  ,   mod_path
  ;

  id       = acc.queue.shift();
  mod_path = acc.package.modules[id];
  mod_path = path.join(acc.package._root, mod_path);

  console.log('---[Load]: '+acc.package.name+'/'+id);

  fs.readFile(mod_path, function(err, data){
    if (err) {
      callback(err);
      return;
    }

    fs.stat(mod_path, function(err, stat){
      if (err) {
        callback(err);
        return;
      }
      
      acc.package._modules[id] =
      { source: data.toString()
      , mtime:  stat.mtime
      , path:   mod_path
      };
      
      _reenter(acc, callback);
    });
  });
};
