var package_loader    = require('./package_loader')
,   package_cacher    = require('./package_cacher')
,   package_archiver  = require('./package_archiver')
,   module_loader     = require('./module_loader')
,   module_coffee     = require('./module_coffee_compiler')
,   module_wrapper    = require('./module_wrapper')
,   module_verifier   = require('./module_verifier')
,   module_compressor = require('./module_compressor')
,   ui                = require('../util/ui')
;

var _reenter
,   _package_loader
,   _module_loader
,   _module_coffee_compiler
,   _module_wrapper
,   _module_verifier
,   _module_compressor
,   _package_cacher
;

exports.build = function(packages, config, callback){
  var acc
  ;

  acc =
  { packages:   packages
  , package_loader_queue:    []
  , module_loader_queue:     []
  , module_coffee_queue:     []
  , module_wrapper_queue:    []
  , module_verifier_queue:   []
  , module_compressor_queue: []
  , package_cache_queue:     []
  , config:                  config
  };

  for (name in packages) {
    acc.package_loader_queue.push(name);
  }

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (false) {
  } else if (acc.package_cache_queue.length > 0) {
    _package_cacher(acc, callback);
  } else if (acc.module_compressor_queue.length > 0) {
    _module_compressor(acc, callback);
  } else if (acc.module_wrapper_queue.length > 0) {
    _module_wrapper(acc, callback);
  } else if (acc.module_verifier_queue.length > 0) {
    _module_verifier(acc, callback);
  } else if (acc.module_coffee_queue.length > 0) {
    _module_coffee_compiler(acc, callback);
  } else if (acc.module_loader_queue.length > 0) {
    _module_loader(acc, callback);
  } else if (acc.package_loader_queue.length > 0) {
    _package_loader(acc, callback);
  } else {
    package_archiver(acc.packages, function(err, archive){
      if (err) { callback(err); return; }
      callback(undefined, archive);
    });
  }
};

_package_loader = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.package_loader_queue.shift();
  package = acc.packages[name];

  package_cacher.get(package, function(err, cached_package){
    if (err) {
      callback(err, undefined);
      return;
    }

    if (cached_package) {
      ui.puts('[CACHE]: '+package.name);
      acc.packages[name] = cached_package;
      _reenter(acc, callback);
      return;
    }
    
    ui.puts('[BUILD]: '+package.name);

    package_loader(package, function(err, package){
      if (err) {
        callback(err, undefined);
        return;
      }

      acc.packages[name] = package;

      acc.module_loader_queue.push(name);
      _reenter(acc, callback);
    });
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

    acc.module_compressor_queue.push(name);
    _reenter(acc, callback);
  });
};

_module_compressor = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.module_compressor_queue.shift();
  package = acc.packages[name];

  if (acc.config.devbuild) {
    acc.package_cache_queue.push(name);
    _reenter(acc, callback);
    return;
  }

  module_compressor(package, function(err, package){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = package;

    acc.package_cache_queue.push(name);
    _reenter(acc, callback);
  });
};

_package_cacher = function(acc, callback){
  var name
  ,   package
  ;

  name    = acc.package_cache_queue.shift();
  package = acc.packages[name];

  package_cacher.set(package, function(err){
    if (err) {
      callback(err, undefined);
      return;
    }

    // acc.module_compressor_queue.push(name);
    _reenter(acc, callback);
  });
};
