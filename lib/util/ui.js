var util = require('util')
;

var status_msg = false
;

exports.puts = function(message){
  if (typeof(message) != 'string') { message = util.inspect(message); }
  
  if (status_msg !== false) {
    process.stdout.write('\r\033[2K' + message + '\n -- ' + status_msg + '\r');
  } else {
    process.stdout.write(message + '\n');
  }
};

exports.status = function(line){
  if (line) {
    if (typeof(line) != 'string') { line = util.inspect(line); }
    status_msg = line.toString().replace('\n', '');
    process.stdout.write('\r\033[2K -- ' + status_msg + '\r');
  } else {
    status_msg = false;
    process.stdout.write('\r\033[2K');
  }
};
