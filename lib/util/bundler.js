var reg  = require('./registry')
,   path = require('path')
;

var _reenter
,   _check_local
,   _download
,   _validate
;

exports.update = function(package, options, callback){
  if (typeof callback != 'function') callback = options;
  if (typeof options  != 'object')   options  = {};
  
  reg.info(package, options, function(err, packages){
    if (err) {
      callback(err, undefined);
      return;
    }
    
    var acc
    ,   name
    ;
    
    acc = 
    { check_local_queue: []
    , download_queue:    []
    , validate_queue:    []
    , packages:          packages
    };
    
    for (name in packages) {
      acc.check_local_queue.push(name);
    }
    
    _reenter(acc, callback);
  });
};

_reenter = function(acc, callback){
  if (acc.check_local_queue.length > 0) {
    _check_local(acc, callback);
  } else if (acc.download_queue.length > 0) {
    _download(acc, callback);
  } else if (acc.validate_queue.length > 0) {
    _validate(acc, callback);
  } else {
    callback(undefined, acc.packages);
  }
};

_check_local = function(acc, callback){
  var name
  ,   package
  ,   bundled_path
  ;
  
  if (acc.check_local_queue.length == 0) {
    _reenter(acc, callback);
    return;
  }
  
  name = acc.check_local_queue.shift();
  if (!name) {
    _reenter(acc, callback);
    return;
  }
  
  package      = acc.packages[name];
  bundled_path = path.join(acc.bundle_path, package.name, package.version);
  
  path.exists(bundled_path, function(exists){
    if (exists) {
      acc.validate_queue.push(name);
    } else {
      acc.download_queue.push(name);
    }
  });
};

_download = function(acc, callback){
  
};

_validate = function(acc, callback){
  
};
