var ui = require('../util/ui')
;

var _reenter
,   _wrap_module
;

var globals =
  [ 'module', 'exports', 'require', 'window', 'document', 'console',
    'screen', 'history', 'location', 'navigator', 'undefined' ]
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
    _wrap_module(acc, callback);
  } else {
    callback(undefined, acc.package);
  }
};

_wrap_module = function(acc, callback){
  var id
  ,   module
  ;

  id       = acc.queue.shift();
  module   = acc.package._modules[id];

  ui.status('[Wrap]: '+acc.package.name+'/'+id);

  module.source = '(function('+globals.join(',')+'){\n' + module.source + '\n})';

  _reenter(acc, callback);
};
