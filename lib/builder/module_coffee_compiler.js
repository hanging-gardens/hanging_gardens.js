var spawn = require('child_process').spawn
,   path  = require('path')
,   ui    = require('../util/ui')
;

var _reenter
,   _compile_module
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
    _compile_module(acc, callback);
  } else {
    callback(undefined, acc.package);
  }
};

_compile_module = function(acc, callback){
  var id
  ,   mod_path
  ,   module
  ,   cmd
  ,   js  = ""
  ,   out = ""
  ;

  id       = acc.queue.shift();
  mod_path = acc.package.modules[id];
  module   = acc.package._modules[id];

  if (path.extname(mod_path) != '.coffee') {
    _reenter(acc, callback);
    return;
  }

  ui.status('[Coffee]: '+acc.package.name+'/'+id);

  cmd = spawn('coffee', ['--print', '--stdio', '--bare']);
  cmd.stdout.on('data', function(d){ js  += d.toString(); });
  cmd.stderr.on('data', function(d){ out += d.toString(); });
  cmd.stdin.write(module.source);
  cmd.stdin.end();

  cmd.on('exit', function(code){
    if (code > 0) {
      ui.puts('Coffee Script failed ['+code+'] for '+mod_path+'\n'+out);
      process.exit(1);
    } else {
      module.source = js;
      _reenter(acc, callback);
    }
  });
};