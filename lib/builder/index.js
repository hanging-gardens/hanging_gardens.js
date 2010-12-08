var package_loader  = require('./package_loader')
,   module_loader   = require('./module_loader')
,   module_coffee   = require('./module_coffee_compiler')
,   module_wrapper  = require('./module_wrapper')
,   module_verifier = require('./module_verifier')
;

var _reenter
,   _package_loader
,   _module_loader
,   _module_coffee_compiler
,   _module_wrapper
,   _module_verifier
;

exports.build = function(packages, callback){
  var acc
  ;

  acc =
  { packages:   packages
  , package_loader_queue:  []
  , module_loader_queue:   []
  , module_coffee_queue:   []
  , module_wrapper_queue:  []
  , module_verifier_queue: []
  };

  for (name in packages) {
    acc.package_loader_queue.push(name);
  }

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (acc.package_loader_queue.length > 0) {
    _package_loader(acc, callback);
  } else if (acc.module_loader_queue.length > 0) {
    _module_loader(acc, callback);
  } else if (acc.module_coffee_queue.length > 0) {
    _module_coffee_compiler(acc, callback);
  } else if (acc.module_verifier_queue.length > 0) {
    _module_verifier(acc, callback);
  } else if (acc.module_wrapper_queue.length > 0) {
    _module_wrapper(acc, callback);
  } else {
    callback(undefined, acc.packages);
  }
};

_package_loader = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.package_loader_queue.shift();
  package = acc.packages[name];

  package_loader(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    acc.module_loader_queue.push(name);
    _reenter(acc, callback);
  });
};

_module_loader = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.module_loader_queue.shift();
  package = acc.packages[name];

  module_loader(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    acc.module_coffee_queue.push(name);
    _reenter(acc, callback);
  });
};

_module_coffee_compiler = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.module_coffee_queue.shift();
  package = acc.packages[name];


  module_coffee(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    acc.module_verifier_queue.push(name);
    _reenter(acc, callback);
  });
};

_module_verifier = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.module_verifier_queue.shift();
  package = acc.packages[name];

  module_verifier(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    acc.module_wrapper_queue.push(name);
    _reenter(acc, callback);
  });
};

_module_wrapper = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.module_wrapper_queue.shift();
  package = acc.packages[name];

  module_wrapper(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    // acc.module_verifier_queue.push(name);
    _reenter(acc, callback);
  });
};