var win = require('browser/window');

if (win.XMLHTTPRequest) {
  exports.HTTPRequest = function(){
    win.XMLHTTPRequest.call(this);
  };
} else if (win.ActiveXObject) {
  exports.HTTPRequest = function(){
    win.ActiveXObject.call(this, "Microsoft.XMLHTTP");
  };
}

if (win.XMLHTTPRequest) {
  exports.HTTPRequest.prototype =
    new win.XMLHTTPRequest();
} else if (win.ActiveXObject) {
  exports.HTTPRequest.prototype =
    new win.ActiveXObject("Microsoft.XMLHTTP");
} else {
  throw "No XHR support";
}

exports.XMLHTTPRequest = exports.HTTPRequest;
