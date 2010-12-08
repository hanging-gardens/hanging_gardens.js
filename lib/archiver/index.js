var fs   = require('fs')
,   comp = require('../compressor')
;

var _reenter
,   _archive_package
,   _archive_module
,   _render_archive
;

module.exports = function(packages, callback){
  var acc
  ,   name
  ;
  
  acc =
  { package_queue: []
  , module_queue:  []
  , packages:      packages
  , archive:       []
  };
  
  for (name in packages) {
    acc.package_queue.push(name);
  }
  
  fs.readFile(__dirname + '/../runtime.js', function(err, runtime){
    if (err) {
      callback(err, undefined);
      return;
    }
    
    acc.runtime = { source: runtime };
    comp.yui(acc.runtime, function(err){
      if (err) {
        callback(err, undefined);
        return;
      }
      
      acc.runtime = acc.runtime.source;
      _reenter(acc, callback);
    });
  });
};

_reenter = function(acc, callback){
  if (acc.module_queue.length > 0) {
    _archive_module(acc, callback);
  } else if (acc.package_queue.length > 0) {
    _archive_package(acc, callback);
  } else {
    _render_archive(acc, callback);
  }
};

_archive_package = function(acc, callback){
  var name
  ,   package
  ,   id
  ;
  
  name    = acc.package_queue.shift();
  package = acc.packages[name];
  
  for (id in package._modules) {
    acc.module_queue.push([name, id]);
  }
  
  _reenter(acc, callback);
};

_archive_module = function(acc, callback){
  var name
  ,   package
  ,   id
  ,   module
  ;
  
  name    = acc.module_queue.shift();
  id      = name[1];
  name    = name[0];
  package = acc.packages[name];
  module  = package._modules[id];
  
  module.source = module.source.trim();
  module.source = module.source.replace(/[;]$/, '');
  
  acc.archive.push('"'+name+'/'+id+'":'+module.source);
  
  _reenter(acc, callback);
};

_render_archive = function(acc, callback){
  var modules
  ,   archive
  ,   runtime
  ;
  
  runtime = acc.runtime.toString().split('"__MODULES__"');
  modules = '{' + acc.archive.join(',') + '}';
  archive = runtime[0] + modules + runtime[1];
  
  callback(undefined, archive);
};
