# Hanging Gardens

A JavaScript project structure for NoRIA webpages.


### Philosophy

A lot of effort is put in making JavaScript based RIA development easier. This is a good thing for RIAs. But NonRIA development, development of regular webpages, still feels like we are stuck in 1995. Sure, we have great libraries like jQuery and MooTools but we still treat our .js files like a bunch of hacks. I don't like hacks so I decided to make something that encourages us, developers, to start taking JavaScript coding serious. This was the birth of Hanging Gardens. Hanging Gardens provides an infrastructure to load js code (like you would load Ruby or PHP code) and it turns many small (and well structured) js files into one (often huge) file. This file can then be further optimized by Googles Closure Compiler or JSMin.


### How does it work

A new Hanging Gardens project contains four directories (behaviours, helpers, widgets and vendor) and a `Gardenfile.js` file. Here is an explanation of what should go in each directory or file.

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

Make sure you have Node.js and NPM installed (on OSX: `brew install npm`).

    npm install hanging-gardens


### Building the example

This will build the `Gardenfile.compiled.js` file.

    git clone git://github.com/fd/hanging_gardens.js.git
    cd hanging_gardens.js
    garden example/Gardenfile.js

## The `Gardenfile.js`

The `Gardenfile.js` file specifies what files need to be processed and how they need to be processed.

### General usage

Each file type (behaviours, helpers, widgets and vendor) has its own configuration function.

    behaviours([
      'navigation' // behaviours/navigation.js
      ]);
    
    helpers([
      'base64'     // helpers/base64.js
      ]);
    
    widgets([
      'table'      // widgets/table.js
      ]);
    
    vendor({
      // vendor/jquery.js wrapped in the provided snippet. (__GARDEN_MODULE__
      // gets replaced with the content of vendor/jquery.js)
      'jquery': '__GARDEN_MODULE__ ; exports = window.jQuery;'
      });

Do note that the `vendor` configuration function is different from the others as it supports passing a wrapper snippet. The wrapper snippet is needed sometimes to shoehorn a library into the Hanging Gardens structure. When you don't want to use a wrapper snippet you can just pass `false` instead.

### How to enable JSLint

First you need to have JSLint installed (on OSX: `brew install jslint`). Then in your `Gardenfile.js` add the following line:

    lint();

If you don't want to process some files with JSLint you can use the `skip` option.

    lint({ skip: ['vendor/jquery'] });


### How to enable YUI Compressor

You need to have YUI Compressor installed (on OSX: `brew install yuicompressor`). Then in your `Gardenfile.js` add the following line:

    yuicompressor();


  [example]: https://github.com/fd/hanging_gardens.js/tree/master/example/

