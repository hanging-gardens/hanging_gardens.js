$       = require "jquery"
console = require "browser/console"
bye     = require "app/behaviours/bye"

$ ()=>
  console.log 'hello %o', hello: "hello"
  require 'app/behaviours/hello'

  $("body").append "<p>Hello Anais</p>"

  bye.bye 'Simon'