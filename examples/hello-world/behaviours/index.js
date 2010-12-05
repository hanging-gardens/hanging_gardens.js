var $       = require("../vendor/jquery")
,   console = require("browser/console")
;

$(function(){
  require('./hello');

  $("body").append("<p>Hello Anais</p>");

  console.log('hello %o', {hello: "hello"});
});