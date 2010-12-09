var sys = require('sys')
;

var status_msg = ''
,   prefix     = '\r'
// ,   prefix     = '\n'
,   clear      = '------------------------------------------------------------------------------------------'
;

exports.puts = function(message){
  if (typeof(message) != 'string') { message = sys.inspect(message); }
  process.stdout.write(prefix + message + '\n' + clear + '\r-- ' + status_msg + ' ');
};

exports.status = function(line){
  if (typeof(line) != 'string') { line = sys.inspect(line); }
  status_msg = line.toString().replace('\n', '');
  process.stdout.write(prefix + clear + '\r-- ' + status_msg + ' ');
};
