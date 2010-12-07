var load = require('./loader');

var _reenter
,   _load
;

exports.build = function(packages, callback){
  var acc
  ;

  acc =
  { packages:   packages
  , load_queue: []
  };

  for (name in packages) {
    acc.load_queue.push(name);
  }

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (acc.load_queue.length > 0) {
    _load(acc, callback);
  } else {
    callback(undefined, acc.packages);
  }
};

_load = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.load_queue.shift();
  package = acc.packages[name];

  load(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    _reenter(acc, callback);
  })
};