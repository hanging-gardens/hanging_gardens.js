var globals =
[ 'module'
, 'exports'
, 'require'
, 'window'
, 'document'
, 'console'
, 'screen'
, 'history'
, 'location'
, 'navigator'
, '__filename'
, '__dirname'
, 'setInterval'
, 'setTimeout'
, 'clearInterval'
, 'clearTimeout'
, 'undefined'
].join(',');

module.exports = function(package, callback){
  var module
  ,   id
  ;

  for (id in package._modules) {
    module = package._modules[id];
    module.source = '(function('+globals+'){\n' + module.source + '\n})';
  }

  callback(undefined, package);
};
