(function(sources, main_id, undefined){

  var real_require
  ,   normalize_id
  ,   resolve_id
  ,   modules = {}
  ;

  real_require = function(id, callsite){
    var source
    ,   module
    ,   require
    ,   original_id
    ;

    id     = normalize_id(id, callsite['id']);
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
      require.window = window;
    
      source(module, module.exports, require,
        /*window*/    undefined,
        /*document*/  undefined,
        /*console*/   undefined,
        /*screen*/    undefined,
        /*history*/   undefined,
        /*location*/  undefined,
        /*navigator*/ undefined);
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
    if (sources[id]) return id;
    id = id + '/index';
    if (sources[id]) return id;
    return id;
  };

  real_require('es5-shim', { 'id': '.' });

  main_id = resolve_id(main_id);
  if (sources[main_id]) {
    real_require(main_id, { 'id': '.' });
  }

})("__SPLIT__", "__SPLIT__");