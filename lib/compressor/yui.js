var spawn = require('child_process').spawn
,   fs    = require('fs')
,   ui    = require('../util/ui')
;

module.exports = function(module, callback){
  var data = ""
  ,   cmd
  ,   tmp_file
  ,   out = ""
  ;

  tmp_file = '/tmp/yui-compress-'+Math.random()+'.js';
  fs.writeFile(tmp_file, module.source, function(err){
    if (err) {
      callback(err);
      return;
    }

    cmd = spawn('yuicompressor', [tmp_file]);
    cmd.stdout.on('data', function(d){ data += d.toString(); });
    cmd.stderr.on('data', function(d){ out  += d.toString(); });
    cmd.stdin.end();

    cmd.on('exit', function(code){
      fs.unlink(tmp_file);
      if (code > 0) {
        ui.puts('YUI Compressor failed ['+code+'] for '+module.id+'\n'+out);
      } else {
        module.source = data.toString();
        callback(undefined);
      }
    });
  });
};
