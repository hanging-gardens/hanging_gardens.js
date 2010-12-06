var http   = require('http')
,   fs     = require('fs')
,   path   = require('path')
,   semver = require('./semver')
;

var _reenter
,   _fetch
,   _fetch_local
,   _fetch_remote
,   _process_info
,   _narrow_selectable_versions
,   _finalize
;

exports.info = function(package, local_registry, callback){
  var acc
  ,   entry
  ;
  
  entry = 
  { "dist-tags": { "latest": package.version }
  , "versions":  {}
  };
  
  entry.versions[package.version] = package;
  
  acc =
  { fetch_queue:    []
  , process_queue:  [package.name]
  , narrow_queue:   []
  , registry:       {}
  , local_registry: local_registry
  };
  
  acc.registry[package.name] = entry;
  
  _reenter(acc, callback);
};

exports.download = function(name, version, url, callback){
  
};

_reenter = function(acc, callback){
  if (acc.fetch_queue.length > 0) {
    _fetch(acc, callback);
  } else if (acc.process_queue.length > 0) {
    _process_info(acc, callback);
  } else if (acc.narrow_queue.length > 0) {
    _narrow_selectable_versions(acc, callback);
  } else {
    _finalize(acc, callback);
  }
};

_fetch = function(acc, callback){
  var name
  ,   local_path
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
  
  if (acc.local_registry) {
    local_path = path.join(acc.local_registry, name, 'package.json');
    path.exists(local_path, function(exists){
      if (exists) {
        _fetch_local(name, local_path, acc, callback);
      } else {
        _fetch_remote(name, acc, callback);
      }
    });
  } else {
    _fetch_remote(name, acc, callback);
  }
};

_fetch_local = function(name, local_path, acc, callback){
  var package
  ,   entry
  ;
  
  fs.readFile(local_path, function(err, data){
    if (err) {
      callback(err, undefined);
      return;
    }
    
    package = JSON.parse(data.toString());
    package.dist = { 'path': local_path };
    entry   = { "dist-tags": package.version, "versions": {} };
    entry.versions[package.version] = package;
    acc.registry[name] = entry;
    acc.process_queue.push(name);
    _reenter(acc, callback);
  });
};

_fetch_remote = function(name, acc, callback){
  var client
  ,   request
  ;
  
  client = http.createClient(80, 'registry.npmjs.org');
  
  request = client.request('GET', '/'+name, {'host': 'registry.npmjs.org'});
  request.end();
  
  client.on('error', function(err){
    callback(err, undefined);
  });
  
  request.on('response', function(response){
    var body = ""
    ;
    
    if (response.statusCode == 200) {
      response.setEncoding('utf8');
      response.on('data', function (chunk){
        body += chunk.toString();
      });
      response.on('error', function(err){
        callback(err, undefined);
      });
      response.on('end', function(){
        body = JSON.parse(body);
        acc.registry[name] = body;
        acc.process_queue.push(name);
        _reenter(acc, callback);
      });
    } else {
      callback(new Error("Response["+response.statusCode+"]: "+name), undefined);
    }
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
  
  entry = acc.registry[name];
  entry.versions = entry.versions || {};
  
  for (ver in entry.versions) {
    package = entry.versions[ver];
    
    if (package.overlay && package.overlay.garden) {
      for (key in package.overlay.garden)
        package[key] = package.overlay.garden[key];
    }
    
    package.dependencies = package.dependencies || {};
    for (key in package.dependencies) {
      acc.narrow_queue.push([key, package.dependencies[key]]);
      if (!acc.registry[key]) {
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
  entry = acc.registry[name];
  
  for (ver in entry.versions) {
    package = entry.versions[ver];
    package.engines = package.engines || {};
    
    if (package.engines.garden != '*') {
      delete entry.versions[ver];
      continue;
    }
    
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
  
  for (name in acc.registry) {
    entry = acc.registry[name];
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
  ,   bundle
  ;
  
  package =
    { "name" : "hello-world"
    , "version" : "0.0.1"
    , "type" : "application"
    , "main" : "./behaviours/index"
    , "hanging-gardens" :
      { "lint" : true
      , "compression" : "yui"
      }
    , "dependencies" :
      { "jquery": ">= 1.4.4"
      }
    };
  
  bundle = "/Users/Simon/Projects/hanging_gardens.js/examples";
  
  exports.info(package, bundle, function(err, packages){
    if(err) throw err;
    console.log(packages);
  });
}