(function(exports, prefix, inlined_src){

  var clean_eval = function(source, context){
    var exports     = undefined
    ,   inlined_src = undefined
    ,   prefix      = undefined
    ;
    with(context){ return eval(source); };
  };

  var modules         = {}
  ,   initialized     = false
  ,   active_requests = []
  ;

  var normalize_path
  ,   ajax_req
  ,   load_modules
  ,   require
  ,   init_gardenfile
  ,   load_gardenfile
  ,   comp_gardenfile
  ,   init_behaviours
  ;

  prefix = prefix || './';

  normalize_path = function(path){
    path = path.replace(/(\.js)?$/, '.js');
    path = path.replace(/\/\//g, '/');
    path = path.replace(/^\.\//, '');
    return path;
  };

  ajax_req = function(path, clb){
    var req;

    path = prefix + path;

    if (typeof XMLHttpRequest != 'undefined') {
      req = new XMLHttpRequest();
    } else {
      req = new ActiveXObject("Msxml2.XMLHTTP");
    }

    req.open("GET", path, true);

    req.onreadystatechange = (function() {
      if (req.readyState==4) {
        if (req.status==200 || req.status==0) {
          clb(false, req.responseText);
        } else {
          clb("["+path+"]: Non 200 response status: "+req.status , undefined);
        }
      }
    });

    req.send(null);
  };


  load_modules = function(){
    var path, wrapper, clb;
    for (path in modules) {
      if (!modules[path].loaded) {
        active_requests.push(path);
        wrapper = modules[path].wrapper;

        clb = (function(path, wrapper) {
          return function(err, src){
            if (err) { throw(err); }

            if (wrapper) {
              src = wrapper.replace("__GARDEN_MODULE__", "\n\n"+src+"\n\n");
            }

            modules[path].exports = undefined;
            modules[path].source  = src;
            modules[path].loaded  = true;
            modules[path].evaled  = false;

            active_requests.pop();
            if (active_requests.length == 0) {
              init_behaviours();
            }
          };
        })(path, wrapper);

        ajax_req(path, clb);
      }
    }
  };

  init_gardenfile = function(){
    if (initialized) { return false; }
    initialized = true;

    if (inlined_src) {
      comp_gardenfile();
    } else {
      load_gardenfile();
    };

    return true;
  };

  load_gardenfile = function(){
    ajax_req('Gardenfile.js', function(err, src){
      if (err) { throw(err); }

      var ctx = {
        vendor:   function(paths){
          var path, wrapper;
          for (path in paths) {
            wrapper = paths[path];
            path = 'vendor/'+normalize_path(path);
            modules[path] = { wrapper: wrapper };
          }
        },
        behaviours: function(paths){
          var path, i;
          for (i in paths) {
            path = paths[i];
            path = 'behaviours/'+normalize_path(path);
            modules[path] = {};
          }
        },
        helpers:   function(paths){
          var path, i;
          for (i in paths) {
            path = paths[i];
            path = 'helpers/'+normalize_path(path);
            modules[path] = {};
          }
        },
        widgets:   function(paths){
          var path, i;
          for (i in paths) {
            path = paths[i];
            path = 'widgets/'+normalize_path(path);
            modules[path] = {};
          }
        }
      };

      clean_eval(src, ctx);
      load_modules();
    });
  };

  comp_gardenfile = function(){
    var idx, path, wrapper, src, mod;

    for (idx in inlined_src) {
      mod = inlined_src[idx];

      path    = normalize_path(mod[0]);
      wrapper = mod[1];
      src     = mod[2];

      if (wrapper) {
        src = wrapper.replace("__GARDEN_MODULE__", "\n\n"+src+"\n\n");
      }

      modules[path] = { exports: undefined, source: src, evaled: false };
    }

    init_behaviours();
  };


  init_behaviours = function(){
    if (modules['behaviours/main.js']) {
      require('behaviours/main.js');
    }
  };


  require = function(path){
    path = normalize_path(path);

    var module = modules[path];

    if (!module) {
      throw('Unknown module: '+path);
    }

    if (!module.evaled) {
      var ctx = { exports: undefined, require: require };
      clean_eval(module.source, ctx);
      module.evaled  = true;
      module.exports = ctx.exports;
    }

    return module.exports;
  };


  exports.HangingGardens = {};
  exports.HangingGardens.require = require;

  init_gardenfile();
})(this, window.HANGING_GARDENS_PREFIX || false, false);