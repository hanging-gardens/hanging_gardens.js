# Hanging Gardens

A JavaScript project structure for NoRIA webpages.


### Philosophy

A lot of effort is put in making JavaScript based RIA development easier. This is a good thing for RIAs. But NonRIA development, development of regular webpages, still feels like we are stuck in 1995. Sure, we have great libraries like [jQuery][jquery] and [MooTools][mootools] but we still treat our .js files like a bunch of hacks. I don't like hacks so I decided to make something that encourages us, developers, to start taking JavaScript coding serious. This was the birth of Hanging Gardens. Hanging Gardens provides an infrastructure to load js code (like you would load Ruby or PHP code) and it turns many small (and well structured) js files into one (often huge) file. This file can then be further optimized by Googles Closure Compiler or JSMin.


### How does it work

A new Hanging Gardens project contains four directories (behaviours, helpers, widgets and lib) and a `package.json` file. Here is an explanation of what should go in each directory or file.

* `behaviours`: contains files with code that makes a webpage or parts thereof
  behave in a certain way. Think of these as controllers (as in MVC).
* `helpers`: contains files with code that you need to use often in many
  different files.
* `widgets`: contains files with code for reusable components, like a sortable
  table for example.
* `lib`: contains files with code that doesn't fit in any of the other directories.
* `package.json`: is a [CommonJS/Package][cjs_package] file which is compatible with the [npm package manager][npm].

Take a look at the [examples][examples] for more information.


### Installation

Make sure you have [Node.js][nodejs] and [NPM][npm] installed (on OSX: `brew install npm`).

    npm install hanging-gardens -g


### Building the example

This will build a `package.js` file.

    git clone git://github.com/fd/hanging_gardens.js.git
    cd hanging_gardens.js
    garden examples/hello-world-js/package.json
    # or
    garden examples/hello-world-coffee/package.json

## The package.js file

The `package.js` file specifies the project dependencies and how the project files should be processed.

### Format

    { "type"    : "application"           // this enables the extra directories
    , "main"    : "./behaviours/index.js" // the main behaviour

    // the dependecies
    , "dependencies" :
      { "jquery": ">= 1.4.3"
      }
    }

### How to enable JSLint

In your `package.json` file add this option:

    "lint": true


### How to enable YUI Compressor

In your `package.json` file add this option:

    "compression": "yui"


### How to use Coffee Script

Just create a `.coffee` file.


  [examples]:     https://github.com/fd/hanging_gardens.js/tree/master/examples/
  [coffee]:      http://jashkenas.github.com/coffee-script/
  [jslint]:      http://www.jslint.com/
  [yuicomp]:     http://developer.yahoo.com/yui/compressor/
  [jquery]:      http://jquery.com/
  [mootools]:    http://mootools.net/
  [nodejs]:      http://nodejs.org/
  [npm]:         http://npmjs.org/
  [cjs_package]: http://wiki.commonjs.org/wiki/Packages/1.0

