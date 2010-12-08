var _reenter
,   _compress_module
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
    _compress_module(acc, callback);
  } else {
    callback(undefined, acc.package);
  }
};

_compress_module = function(acc, callback){
  var id
  ,   module
  ;

  id       = acc.queue.shift();
  module   = acc.package._modules[id];

  console.log('---[Wrap]: '+acc.package.name+'/'+id);

  module.source = '(function('+globals.join(',')+'){' + module.source + '})';

  _reenter(acc, callback);
};
