(function(window, sources, main_id, aliases, undefined){

  var real_require
  ,   normalize_id
  ,   resolve_id
  ,   modules = {}
  ,   embedded = false
  ,   parent_module
  ,   __filename, __dirname, scripts, script
  ;

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
      require.engine = "garden";
      
      if (id == 'browser/window'){
        require.window = window;
      }
      
      source.call({}, module, module.exports, require
      , /* window        */ undefined
      , /* document      */ undefined
      , /* console       */ require("browser/console")
      , /* screen        */ undefined
      , /* history       */ undefined
      , /* location      */ undefined
      , /* navigartor    */ undefined
      , /* __filename    */ __filename
      , /* __dirname     */ __dirname
      , /* setInterval   */ window.setInterval
      , /* setTimeout    */ window.setTimeout
      , /* clearInterval */ window.clearInterval
      , /* clearTimeout  */ window.clearTimeout
      );
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

  // handle embedded archives
  if (window.require && !window.require.external) {
    embedded      = true;
    parent_module = window;
    window        = window.require('browser/window');
  }
  
  // get the script location
  scripts    = window.document.getElementsByTagName("script");
  script     = scripts[scripts.length-1];
  __filename = script.src;
  __dirname  = __filename.split('/');
  __dirname.pop();
  __dirname  = __dirname.join('/');

  // export the external require
  script.require = function(id) {
    real_require(id, { 'id': '.' });
  };
  
  if (window.require) {
    var _require = window.require;
  }
  window.require = function(id) {
    var src
    ;
    
    for (src in window.require.archives) {
      try { return require(id); } catch(e){}
    }
    
    throw('Connot find module \''+id+'\'');
  };
  window.require.external = true;
  window.require.archives = _require.archives || {};
  window.require.archives[__filename] = script.require;
  window.require.makeCompatible = function(){
    var r = window.require;
    window.require = _require;
    return r;
  };

  // load the ES5 shim
  real_require('es5-shim', { 'id': '.' });

  // boot the application
  main_id = resolve_id(main_id);
  if (sources[main_id]) {
    real_require(main_id, { 'id': '.' });
    
    if (embedded) { parent_module.exports = modules[id]['exports']; }
  }

})(this, "__SPLIT__", "__SPLIT__", "__SPLIT__");