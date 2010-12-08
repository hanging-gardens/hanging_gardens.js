var spawn = require('child_process').spawn
,   fs    = require('fs')
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
  ;

  id       = acc.queue.shift();
  module   = acc.package._modules[id];

  if (acc.package.lint === false) {
    console.log('---[Lint]: '+acc.package.name+'/'+id+'\n[SKIPED]');
    _reenter(acc, callback);
    return;
  }

  console.log('---[Lint]: '+acc.package.name+'/'+id);

  print_it = function(d){
    var chunk = d.toString().trim();
    if (chunk.indexOf('Valid') == -1) { has_errors = true; }
    console.log(chunk);
  };
  jsl_conf = __dirname + '/../../extras/node-lint.json';
  tmp_file = '/tmp/node-lint-'+Math.random()+'.js';
  
  fs.writeFile(tmp_file, module.source, function(err){
    if (err) throw err;

    cmd = spawn('node-lint', ['--config='+ jsl_conf, tmp_file]);
    cmd.stdout.on('data', print_it);
    cmd.stderr.on('data', print_it);
    cmd.stdin.end();
    
    cmd.on('exit', function(code){
      fs.unlink(tmp_file);
      if (code > 0 || has_errors) {
        console.log('Lint failed ['+code+'].');
      } else {
        _reenter(acc, callback);
      }
    });
  });
};
