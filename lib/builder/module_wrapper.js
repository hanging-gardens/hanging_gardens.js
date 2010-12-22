module.exports = function(package, callback){
  var module
  ,   id
  ;

  for (id in package._modules) {
    module = package._modules[id];
    module.source = '(function(){with(this){\n'+module.source+'\n}})';
  }

  callback(undefined, package);
};
