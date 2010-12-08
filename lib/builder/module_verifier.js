var spawn = require('child_process').spawn
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
  ;

  id       = acc.queue.shift();
  module   = acc.package._modules[id];

  if (acc.package.lint === false) {
    console.log('---[JSLint]\n[SKIPED]');
    _reenter(acc, callback);
    return;
  }

  console.log('---[JSLint]: '+acc.package.name+'/'+id);

  print_it = function(d){ console.log(d.toString().trim()); };
  jsl_conf = __dirname + '/../../extras/jsl.conf';

  cmd = spawn('jsl', ['-nologo', '-stdin', '-conf', jsl_conf]);
  cmd.stdout.on('data', print_it);
  cmd.stderr.on('data', print_it);
  cmd.stdin.write(module.source);
  cmd.stdin.end();

  cmd.on('exit', function(code){
    if (code >= 2) {
      console.log('JSLint failed ['+code+'].');
    } else {
      _reenter(acc, callback);
    }
  });
};
