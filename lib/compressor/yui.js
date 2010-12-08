var spawn = require('child_process').spawn
,   fs    = require('fs')
;

module.exports = function(module, callback){
  var data = ""
  ,   cmd
  ,   tmp_file
  ;

  tmp_file = '/tmp/yui-compress-'+Math.random()+'.js';
  fs.writeFile(tmp_file, module.source, function(err){
    if (err) {
      callback(err);
      return;
    }

    cmd = spawn('yuicompressor', [tmp_file]);
    cmd.stdout.on('data', function(d){ data += d.toString(); });
    cmd.stderr.on('data', function(d){ console.log(d.toString().trim()); });
    cmd.stdin.end();

    cmd.on('exit', function(code){
      fs.unlink(tmp_file);
      if (code > 0) {
        console.log('YUI Compressor failed ['+code+'].');
      } else {
        module.source = data.toString();
        callback(undefined);
      }
    });
  });
};
