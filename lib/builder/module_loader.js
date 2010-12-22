var fs   = require('fs')
,   path = require('path')
,   ui   = require('../util/ui')
;

module.exports = function(package, callback){
  var id
  ,   mod_path
  ,   data
  ,   stat
  ;

  for (id in package._modules) {
    mod_path = package._modules[id].path;
    mod_path = path.join(package._root, mod_path);
    
    ui.status('[Load]: '+id);
    
    try {
      data = fs.readFileSync(mod_path);
      stat = fs.statSync(mod_path);
      
      package._modules[id].source = data.toString();
      package._modules[id].mtime  = stat.mtime;
      
    } catch(e) {
      callback(new Error("Failed to load module at path: "+ mod_path));
      return;
    }
  }

  callback(undefined, package);
};