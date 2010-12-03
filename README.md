# Hanging Gardens

A JavaScript project structure for NoRIA webpages.


### Philosophy

A lot of effort is put in making JavaScript based RIA development easier. This is a good thing for RIAs. But NonRIA development, development of regular webpages, still feels like we are stuck in 1995. Sure, we have great libraries like jQuery and MooTools but we still treat our .js files like a bunch of hacks. I don't like hacks so I decided to make something that encourages us, developers, to start taking JavaScript coding serious. This was the birth of Hanging Gardens. Hanging Gardens provides an infrastructure to load js code (like you would load Ruby or PHP code) and it turns many small (and well structured) js files into one (often huge) file. This file can then be further optimized by Googles Closure Compiler or JSMin.


### How does it work

A new Hanging Gardens project contains four directories (behaviours, helpers, widgets and vendor) and `Gardenfile.js`. Here is an explanation of what should go in each directory or file.

* `behaviours`: contains files with code that makes a webpage or parts thereof
  behave in a certain way. Think of these as controllers (as in MVC).
* `helpers`: contains files with code that you need to use often in many
  different files.
* `widgets`: contains files with code for reusable components, like a sortable
  table for example.
* `vendor`: contains any JS libraries/plugins that you want to use. They
  don't have to be explicitly compatible with Hanging Gardens.
* `Gardenfile.js`: is sort of like a manifest. It tells Hanging Gardens which
  files need to be packaged.

Take a look at the [example][example] for more information.


### Installation

    npm install hanging-gardens


### Building the example

This will build the `Gardenfile.compiled.js` file.

    git clone git://github.com/fd/hanging_gardens.js.git
    cd hanging_gardens.js
    garden example/Gardenfile.js


  [example]: https://github.com/fd/hanging_gardens.js/tree/master/example/

