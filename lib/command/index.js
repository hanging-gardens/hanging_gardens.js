var sys      = require('sys')
,   fs       = require('fs')
,   path     = require('path')
,   optparse = require('../util/optparse')
,   runner   = require('../runner')
,   hg_reg   = require('hanging_gardens_registry')
;


var SWITCHES =
    [ ['-o', '--output [FILE]', 'set the path for the compiled JavaScript']
    , ['-w', '--watch',         'watch scripts for changes, and recompile']
    , ['-v', '--version',       'display Hanging Gardens version']
    , ['-h', '--help',          'display this help message']
    , ['-d', '--dev',           'make a development build']
    ]
,   BANNER = 'garden packages a Hanging Gardens project.\n\n'+
             'Usage:\n  garden path/to/package.json'
,   VERSION = '1.0.0'
;


var run
,   usage
,   version
,   compile
,   watch
,   parse_options
;

process.on('exit', function(){
  console.log('');
});

run = exports.run = function(){
  var options
  ;

  parse_options(function(parser, options){

    if (options.help) {
      return usage(parser);
    }

    if (options.version) {
      return version();
    }

    if (options.arguments.length != 1) {
      return usage(parser);
    }

    if (options.watch) {
      return watch(options);
    }

    return compile(options);
  });
}

usage = function(parser){
  sys.puts(parser.help());
  return process.exit(0);
};

version = function() {
  sys.puts("Hanging Gardens version " + VERSION);
  return process.exit(0);
};

compile = function(options){
  var config
  ;

  fs.realpath(options.arguments[0], function(err, package_json){
    if (err) throw err;

    config =
    { registries:
      [ { type: 'local', path: hg_reg.path }
      , { type: 'remote' }
      ]
    , cache_dir: path.join(process.env.HOME, '.garden')
    , output:    options.output || path.dirname(package_json)+'/package.js'
    , devbuild:  options.dev
    };

    runner.run(config, package_json, function(err){
      // if (err) throw err;
    });
  });
};

watch = function(options){
  var config
  ;

  fs.realpath(options.arguments[0], function(err, package_json){
    if (err) throw err;

    config =
    { registries:
      [ { type: 'local', path: hg_reg.path }
      , { type: 'remote' }
      ]
    , cache_dir: path.join(process.env.HOME, '.garden')
    , output:    options.output || path.dirname(package_json)+'/package.js'
    , devbuild:  options.dev
    };

    runner.watch(config, package_json, function(err){
      if (err) throw err;
    });
  });
};

parse_options = function(callback){
  var option_parser
  ,   options
  ;

  option_parser = new optparse.OptionParser(SWITCHES, BANNER);

  options = option_parser.parse(process.argv.slice(2, process.argv.length));

  callback(option_parser, options);
};
