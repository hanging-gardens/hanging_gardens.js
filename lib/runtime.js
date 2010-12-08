(function(sources, undefined){

  var real_require
  ,   normalize_id
  ,   modules = {}
  ;

  real_require = function(id, callsite){
    var source
    ,   boot
    ,   module
    ,   require
    ;

    if (callsite === true) {
      boot     = true;
      callsite = { 'id': '.' };
    }

    id = normalize_id(id, callsite['id']);

    switch (id) {
    case 'browser/window':    return window;
    case 'browser/document':  return document;
    case 'browser/console':   return console;
    case 'browser/screen':    return screen;
    case 'browser/history':   return history;
    case 'browser/location':  return location;
    case 'browser/navigator': return navigator;
    default:
      source = sources[id];
      module = modules[id];

      if (!source) {
        throw('Connot find module \''+id+'\'');
      }

      if (!module) {
        module =
        { "exports": {}
        , "id":      id
        };

        modules[id] = module;

        require = function(id){ return real_require(id, module); };
        require.main = modules['behaviours/index'];

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
    }
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

  if (sources['behaviours/index']) {
    real_require('behaviours/index', true);
  }

})(__MODULES__);