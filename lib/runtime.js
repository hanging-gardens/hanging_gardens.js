(function(modules){

  var require
  ,   normalize_path
  ,   boot
  ;

  require = function(path){
    path = normalize_path(path);

    var module = modules[path];

    if (!module) {
      throw('Unknown module: '+path);
    }

    if (!module.evaled) {
      var ctx = { "exports": {}
                , "require": require
                }
      ;

      module['container'](ctx);
      module.evaled  = true;
      module['exports'] = ctx['exports'];
    }

    return module['exports'];
  };

  boot = function(){
    if (modules['behaviours/index.js']) {
      require('behaviours/index.js');
    }
  };

  normalize_path = function(path){
    path = path.replace(/(\.js)?$/, '.js');
    path = path.replace(/\/\//g, '/');
    path = path.replace(/^\.\//, '');
    return path;
  };

  boot();

})(__MODULES__);