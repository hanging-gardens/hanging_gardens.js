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
             'Usage:\n'+
             '  garden build <options> path/to/package.json\n'+
             '  garden watch <options> path/to/package.json'
,   VERSION = '1.1.1'
;


var run
,   usage
,   version
,   compile
,   watch
,   parse_options
;

run = exports.run = function(){
  var options
  ,   argv
  ;

  argv = process.argv.slice(2, process.argv.length);

  if (argv[0] == 'build') {
    argv.shift();
  } else if (argv[0] == 'watch') {
    argv[0] = '-w';
  } else {
    argv.unshift('-h');
  }

  parse_options(argv, function(parser, options){

    if (options.help) {
      return usage(parser);
    }

    if (options.version) {
      return version();
    }

    if (options.arguments.length == 0) {
      var package_json
      ;
      
      try {
        package_json = fs.realpathSync('./package.json');
        options.arguments.push(package_json);
      } catch(e) {}
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
  var usage = parser.help();
  usage = usage.replace(/^.+[-][-]watch.+\n/m, '');
  sys.puts(usage);
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
      [ { type: 'stdlib', path: __dirname + '/../stdlib' }
      , { type: 'local',  path: hg_reg.path }
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
      [ { type: 'stdlib', path: __dirname + '/../stdlib' }
      , { type: 'local',  path: hg_reg.path }
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

parse_options = function(argv, callback){
  var option_parser
  ,   options
  ;

  option_parser = new optparse.OptionParser(SWITCHES, BANNER);

  options = option_parser.parse(argv);

  callback(option_parser, options);
};
