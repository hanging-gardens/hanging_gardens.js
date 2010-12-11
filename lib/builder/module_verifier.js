var spawn = require('child_process').spawn
,   fs    = require('fs')
,   ui    = require('../util/ui')
,   lint  = require('../lint')
;

var _reenter
,   _verify_module
;

module.exports = function(package, callback){
  var acc
  ,   id
  ;

  acc =
  { package: package
  , queue:   []
  };

  for (id in package._modules) {
    acc.queue.push(id);
  }

  _reenter(acc, callback);
};

_reenter = function(acc, callback){
  if (acc.queue.length > 0) {
    _verify_module(acc, callback);
  } else {
    callback(undefined, acc.package);
  }
};

_verify_module = function(acc, callback){
  var id
  ,   module
  ,   cmd
  ,   print_it
  ,   jsl_conf
  ,   tmp_file
  ,   has_errors
  ,   out = ""
  ;

  id       = acc.queue.shift();
  module   = acc.package._modules[id];

  if (acc.package.lint === false) {
    ui.status('[Lint]: '+acc.package.name+'/'+id+' [SKIPED]');
    _reenter(acc, callback);
    return;
  }

  ui.status('[Lint]: '+acc.package.name+'/'+id);

  lint(module.source, function(err, found, output){
    if (found > 0) {
      ui.puts('Lint failed for '+acc.package.name+'/'+id+'\n'+output);
      callback(new Error('Lint failed'), undefined);
    } else {
      _reenter(acc, callback);
    }
  });
};
