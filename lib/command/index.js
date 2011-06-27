var util     = require('util')
,   fs       = require('fs')
,   path     = require('path')
,   runner   = require('../runner')
,   hg_reg   = require('hanging_gardens_registry')
,   Operetta = require("../util/operetta").Operetta
;

var cli
;

cli = new Operetta();

cli.banner = 'garden packages a Hanging Gardens project.';

cli.command('build', "Build the archive", function(cmd){
  cmd.parameters(['-o','--output'], "set the path for the compiled JavaScript");
  cmd.parameters(['-d','--dev'], "make a development build");
  cmd.start(function(values){
    var config
    ,   package_json
    ;

    if (values.positional.length == 0) {
      values.positional.push('./package.json');
    }

    try {
      package_json = fs.realpathSync(values.positional[0]);
    } catch(e) {}

    if (!package_json) {
      return cmd.usage();
    }

    config =
    { registries:
      [ { type: 'stdlib', path: __dirname + '/../stdlib' }
      , { type: 'local',  path: hg_reg.path }
      , { type: 'remote' }
      ]
    , cache_dir: path.join(process.env.HOME, '.garden')
    , output:    (values['-o'] ? values['-o'][0] : path.dirname(package_json)+'/package.js')
    , devbuild:  (!! values['-d'])
    };
    
    console.log(config);

    runner.run(config, package_json, function(err){
      // if (err) throw err;
    });
  });
});

cli.command('watch', "Watch a project for changes and rebuild", function(cmd){
  cmd.parameters(['-o','--output'], "set the path for the compiled JavaScript");
  cmd.parameters(['-d','--dev'], "make a development build");
  cmd.start(function(values){
    var config
    ,   package_json
    ;

    if (values.positional.length == 0) {
      values.positional.push('./package.json');
    }

    try {
      package_json = fs.realpathSync(values.positional[0]);
    } catch(e) {}

    if (!package_json) {
      return cmd.usage();
    }

    config =
    { registries:
      [ { type: 'stdlib', path: __dirname + '/../stdlib' }
      , { type: 'local',  path: hg_reg.path }
      , { type: 'remote' }
      ]
    , cache_dir: path.join(process.env.HOME, '.garden')
    , output:    (values['-o'] ? values['-o'][0] : path.dirname(package_json)+'/package.js')
    , devbuild:  (!! values['-d'])
    };

    runner.watch(config, package_json, function(err){
      // if (err) throw err;
    });
  });
});

module.exports = cli;
