var local  = require('./local/info')
,   remote = require('./remote/info')
,   sys    = require('sys')
;

var _info
,   _finish
;

exports.info = function(name, config, callback){
  var acc
  ,   idx
  ;

  acc =
  { registries: []
  , config:     config
  , entry:
    { name:     name
    , versions: {}
    }
  };

  for (idx in config.registries) {
    acc.registries.push(config.registries[idx]);
  }

  _info(acc, callback);
};

_info = function(acc, callback){
  var registry
  ,   registry_info
  ,   ver
  ,   package
  ;

  if (acc.registries.length == 0) {
    _finish(acc, callback);
    return;
  }

  registry = acc.registries.shift();
  if (!registry) {
    _info(acc, callback);
  }

  switch (registry.type) {
  case 'local':  registry_info = local;  break;
  case 'remote': registry_info = remote; break;
  }

  registry_info(acc.entry.name, registry, function(err, versions){
    if (err){
      console.log("Failed to consult: "+sys.inspect(registry));
      _info(acc, callback);
      return;
    }

    for (ver in versions) {
      package = versions[ver];
      package.engines = package.engines || {};

      if (package.engines && package.engines.garden == '*') {
        acc.entry.versions[ver] = acc.entry.versions[ver] || versions[ver];
      }
    }

    callback(undefined, acc.entry);
  });
};

_finish = function(acc, callback){
  var count = 0
  ,   ver
  ;

  for (ver in acc.entry.versions) count += 1;

  if (count == 0) {
    callback(new Error('Package not found: '+ acc.entry.name), undefined);
    return;
  }

  callback(undefined, acc.entry);
};
