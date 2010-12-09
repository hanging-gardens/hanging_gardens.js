
var status_msg = ''
,   clear  = '------------------------------------------------------------------------------------------'
;

exports.puts = function(message){
  process.stdout.write('\r' + message + '\n' + clear + '\r-- ' + status_msg + ' ');
};

exports.status = function(line){
  status_msg = line.toString().trim();
  process.stdout.write('\r' + clear + '\r-- ' + status_msg + ' ');
};
