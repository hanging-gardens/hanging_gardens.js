var ui    = require('../util/ui')
,   lint  = require('../lint')
;

module.exports = function(package, callback){
  var module
  ,   id
  ,   failed = false;
  ;

  if (package.lint === false) {
    ui.status('[Lint]: '+package.name+' [SKIPED]');
    callback(undefined, package);
    return;
  }

  for (id in package._modules) {
    ui.status('[Lint]: '+id);
    
    module = package._modules[id];
    
    lint(module.source, function(err, found, output){
      if (found > 0) {
        ui.puts('Lint failed for '+id+'\n'+output);
        failed = failed || true;
      }
    });
  }

  if (failed) {
    callback(new Error('Lint failed'), undefined);
  } else {
    callback(undefined, package);
  }
};
