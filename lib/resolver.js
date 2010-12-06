var semver   = require('./util/semver')
,   registry = require('./registry')
;

var _reenter
,   _fetch_info
,   _process_info
,   _narrow_selectable_versions
,   _finalize
;

module.exports = function(package, config, callback){
  var acc
  ,   entry
  ;

  entry =
  { "dist-tags": { "latest": "0.0.0" }
  , "versions":  {}
  };

  entry.versions["0.0.0"] = package;

  acc =
  { fetch_queue:    []
  , process_queue:  ["_application"]
  , narrow_queue:   []
  , packages:       {}
  , config:         config
  };

  acc.packages["_application"] = entry;

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (acc.fetch_queue.length > 0) {
    _fetch_info(acc, callback);
  } else if (acc.process_queue.length > 0) {
    _process_info(acc, callback);
  } else if (acc.narrow_queue.length > 0) {
    _narrow_selectable_versions(acc, callback);
  } else {
    _finalize(acc, callback);
  }
};

_fetch_info = function(acc, callback){
  var name
  ,   client
  ,   request
  ;

  if (acc.fetch_queue.length == 0){
    _reenter(acc, callback);
    return;
  }

  name = acc.fetch_queue.shift();
  if (!name) {
    _reenter(acc, callback);
    return;
  }

  registry.info(name, acc.config, function(err, entry){
    if (err) {
      callback(err, undefined);
      return;
    }

    acc.packages[name] = entry;
    acc.process_queue.push(name);
    _reenter(acc, callback);
  });
};

_process_info = function(acc, callback){
  var entry
  ,   package
  ,   name
  ,   ver
  ,   key
  ;

  if (acc.process_queue.length == 0){
    _reenter(acc, callback);
    return;
  }

  name = acc.process_queue.shift();
  if (!name) {
    _reenter(acc, callback);
    return;
  }

  entry = acc.packages[name];
  entry.versions = entry.versions || {};

  for (ver in entry.versions) {
    package = entry.versions[ver];

    if (package.engines)

    if (package.overlay && package.overlay.garden) {
      for (key in package.overlay.garden)
        package[key] = package.overlay.garden[key];
    }

    package.dependencies = package.dependencies || {};
    for (key in package.dependencies) {
      acc.narrow_queue.push([key, package.dependencies[key]]);
      if (!acc.packages[key]) {
        acc.fetch_queue.push(key);
      }
    }
  }

  _reenter(acc, callback);
};

_narrow_selectable_versions = function(acc, callback){
  var entry
  ,   package
  ,   requirement
  ,   name
  ,   rver
  ,   ver
  ,   key
  ,   length
  ;

  if (acc.narrow_queue.length == 0){
    _reenter(acc, callback);
    return;
  }

  requirement = acc.narrow_queue.shift();
  if (!requirement) {
    _reenter(acc, callback);
    return;
  }

  name  = requirement[0];
  rver  = requirement[1];
  entry = acc.packages[name];

  for (ver in entry.versions) {
    package = entry.versions[ver];

    if (!semver.satisfies(ver, rver)) {
      delete entry.versions[ver];
      continue;
    }
  }

  length = 0;
  for (key in entry.versions) length += 1;
  if (length == 0) {
    callback(new Error('Unable to resolve '+name));
    return;
  }

  _reenter(acc, callback);
};

_finalize = function(acc, callback){
  var entry
  ,   name
  ,   ver
  ,   package
  ,   packages = {}
  ,   max
  ;

  for (name in acc.packages) {
    entry = acc.packages[name];
    max   = '0.0.0';

    for (ver in entry.versions) {
      if (semver.gt(ver , max)) {
        max = ver;
      }
    }

    if (max && entry.versions[max]) {
      packages[name] = entry.versions[max];
    }
  }

  callback(undefined, packages);
};

if (module === require.main) {
  var package
  ,   config
  ;

  package =
    { "type" : "application"
    , "main" : "./behaviours/index"
    , "lint" : true
    , "compression" : "yui"
    , "dependencies" :
      { "jquery": ">= 1.4.3"
      }
    };

  config =
    { registries:
      [ { type: 'local', path: '/Users/simon/Sites/hanging_gardens.js/examples/reg' }
      , { type: 'remote' }
      ]
    };

  module.exports(package, config, function(err, packages){
    if(err) throw err;
    console.log(packages);
  });
}