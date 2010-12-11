var JSLINT = require('./jslint')
;

// All of the following are known issues that we think are 'ok'
// (in contradiction with JSLint) more information here:
// http://docs.jquery.com/JQuery_Core_Style_Guidelines
var ok = {
  "Expected an identifier and instead saw 'undefined' (a reserved word).": true,
  "Use '===' to compare with 'null'.": true,
  "Use '!==' to compare with 'null'.": true,
  "Expected an assignment or function call and instead saw an expression.": true,
  "Expected a 'break' statement before 'case'.": true,
  "'e' is already defined.": true
};

var options = {
  "maxerr"    : 100,
  "bitwise"   : false,
  "browser"   : false,
  "eqeqeq"    : false,
  "evil"      : true,
  "forin"     : true,
  "immed"     : true,
  "laxbreak"  : true,
  "onevar"    : false,
  "plusplus"  : false,
  "regexp"    : false,
  "undef"     : true,
  "sub"       : true,
  "white"     : false,
  "predef":
    [ "exports"
    , "module"
    , "require"
    , "__filename"
    , "__dirname"
    , "global"
    , "setInterval"
    , "setTimeout"
    , "clearInterval"
    , "clearTimeout"
    ]
};

module.exports = function(source, callback){
  JSLINT(source, options);

  var e     = JSLINT.errors
  ,   found = 0
  ,   w
  ,   i
  ,   output = []
  ;

  for (i = 0; i < e.length; i++) {
    w = e[i];

    if ( w && !ok[ w.reason ] ) {
      found++;
      output.push("  \033[31m"+found+') \033[4;33m['+w.line+":"+w.character+"] " + w.reason+"\033[0m\n"+
                 "     " + (w.evidence || '').trim());
    }
  }

  output = output.join('\n\n');

  callback(undefined, found, output);
};