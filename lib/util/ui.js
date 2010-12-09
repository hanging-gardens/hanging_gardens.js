var sys = require('sys')
;

var status_msg  = ''
,   line_length = 0
;

exports.puts = function(message){
  var clear = "";
  ;

  if (typeof(message) != 'string') { message = sys.inspect(message); }

  while (line_length > 0) { clear += ' '; line_length -= 1; }

  process.stdout.write('\r' + clear + '\r' + message + '\n' + ' -- ' + status_msg + '\r');
  line_length = status_msg.length + 4;
};

exports.status = function(line){
  var clear = "";
  ;

  if (typeof(line) != 'string') { line = sys.inspect(line); }
  status_msg = line.toString().replace('\n', '');

  while (line_length > 0) { clear += ' '; line_length -= 1; }

  process.stdout.write('\r' + clear + '\r -- ' + status_msg + '\r');
  line_length = status_msg.length + 4;
};
