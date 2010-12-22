var compressor = require('../compressor')
,   ui         = require('../util/ui')
;

var _reenter
,   _compress_module
;

module.exports = function(package, callback){
  var acc
  ,   id
  ,   tool
  ;

  if (!package.compression) {
    callback(undefined, package);
    return;
  }

  tool = compressor[package.compression];
  if (!tool) {
    callback(new Error("Unknown compression tool: "+package.compression), undefined);
    return;
  }

  acc =
  { tool_name: package.compression
  , tool:      tool
  , package:   package
  , queue:     []
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

  ui.status('[Compress: '+acc.tool_name+']: '+id);

  acc.tool(module, function(err){
    if (err) {
      callback(err, undefined);
      return;
    }

    _reenter(acc, callback);
  });
};
