var $       = require("jquery")
,   bye     = require("app/behaviours/bye")
;

console.log(this);

$(function(){
  console.log(__filename);
  console.log(__dirname);
  console.log('hello %o', {hello: "hello"});
  require('../helpers/cool');

  $("body").append("<p>Hello Anais</p>");

  bye.bye('Simon');
});