var window = require('browser/window');

module.exports = (window.console || {});

var members, member, noop;

members = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'trace', 'group', 'groupEnd', 'time', 'timeEnd', 'profile', 'profileEnd', 'count'];

noop = function(){};

for (member in members){
  member = members[member];
  if (!module.exports[member]) {
    module.exports[member] = noop;
  }
}