(function(window, sources, main_id, aliases, undefined){

  var real_require
  ,   normalize_id
  ,   resolve_id
  ,   modules = {}
  ,   global  = {}
  ,   context
  ,   key
  ,   embedded = false
  ,   parent_module
  ,   __filename, __dirname, scripts
  ;

  if (window.require && window.require.engine == 'garden') {
    embedded      = true;
    parent_module = window;
    window        = window.require('browser/window');
  }
  
  scripts = document.getElementsByTagName("script");
  __filename = scripts[scripts.length-1].src;
  __dirname  = __filename.split('/');
  __dirname.pop();
  __dirname  = __dirname.join('/');
  
  for (key in window) { global[key] = undefined; }
  global['setInterval']   = window['setInterval'];
  global['setTimeout']    = window['setTimeout'];
  global['clearInterval'] = window['clearInterval'];
  global['clearTimeout']  = window['clearTimeout'];

  real_require = function(id, callsite){
    var source
    ,   module
    ,   require
    ,   original_id
    ;

    id = normalize_id(id, callsite['id']);
    original_id = id;
    
    id     = resolve_id(id);
    source = sources[id];
    module = modules[id];
    
    if (!source) {
      throw('Connot find module \''+original_id+'\'');
    }
    
    if (!module) {
      module =
      { "exports": {}
      , "id":      id
      };
    
      modules[id] = module;
    
      require = function(id){ return real_require(id, module); };
      require.main   = modules[main_id];
      
      if (id == 'browser/window'){
        require.window = window;
      }
      
      context = {};
      for (key in global) { context[key] = global[key]; }
      context.global     = context;
      context.module     = module;
      context.exports    = module.exports;
      context.require    = require;
      context.console    = require("browser/console");
      context.__filename = __filename;
      context.__dirname  = __dirname;
    
      source.call(context);
    }
    
    return module['exports'];
  };

  normalize_id = function(id, base){
    var id_parts
    ,   base_parts
    ,   abs_parts = []
    ,   part
    ;

    base_parts = base.split('/');
    id_parts   = id.split('/');

    base_parts.pop();

    if (id_parts[0] == '.' || id_parts[0] == '..') {
      id_parts = base_parts.concat(id_parts);
    }

    while (part = id_parts.shift()) {
      if (part == '..') {
        abs_parts.pop();
      } else if (part != '.' && part != '') {
        abs_parts.push(part);
      }
    }

    return abs_parts.join('/');
  };

  resolve_id = function(id) {
    if (aliases[id])          { return resolve_id(aliases[id]);          }
    if (aliases[id+'/index']) { return resolve_id(aliases[id+'/index']); }
    if (sources[id])          { return id; }
    if (sources[id+'/index']) { return id+'/index'; }
    return id;
  };

  real_require('es5-shim', { 'id': '.' });

  main_id = resolve_id(main_id);
  if (sources[main_id]) {
    real_require(main_id, { 'id': '.' });
    
    if (embedded) { parent_module.exports = modules[id]['exports']; }
  }

})(this, "__SPLIT__", "__SPLIT__", "__SPLIT__");