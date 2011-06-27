var fs   = require('fs')
,   util = require('util')
,   comp = require('../compressor')
;

var _archive_package
,   _render_archive
;

module.exports = function(packages, callback){
  var acc
  ,   name
  ,   runtime
  ,   archive
  ;

  acc =
  { archive:       []
  , aliases:       {}
  , runtime :      null
  };

  runtime = { source: fs.readFileSync(__dirname + '/../runtime/index.js') };

  comp.yui(runtime, function(err){
    if (err) {
      callback(err, undefined);
      return;
    }
  
    acc.runtime = runtime.source;

    for (name in packages) {
      acc = _archive_package(packages[name], acc);
    }
    
    archive = _render_archive(acc);
    
    callback(undefined, archive);
  });
};

_archive_package = function(package, acc){
  var id
  ;

  if (package._top) {
    acc.main = package.name;
  }
  
  if (package.modules) {
    for (id in package.modules) {
      acc.aliases[id] = package.modules[id];
    }
  }

  for (id in package._modules) {
    module = package._modules[id];
    
    module.source = module.source.trim();
    module.source = module.source.replace(/[;]$/, '');
    
    acc.archive.push('"'+id+'":'+module.source);
  }

  return acc;
};

_render_archive = function(acc){
  var modules
  ,   archive
  ,   runtime
  ;

  runtime = acc.runtime.toString().split('"__SPLIT__"');
  
  archive =
  [ runtime[0]
  , '{' + acc.archive.join(',') + '}'
  , runtime[1]
  , util.inspect(acc.main)
  , runtime[2]
  , util.inspect(acc.aliases)
  , runtime[3]
  ].join('');

  return archive;
};
