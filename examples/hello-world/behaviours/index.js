var $       = require("jquery")
,   console = require("browser/console")
;

$(function(){
  console.log('hello %o', {hello: "hello"});
  require('./behaviours/hello');

  $("body").append("<p>Hello Anais</p>");

  console.log('hello %o', {hello: "hello"});
});