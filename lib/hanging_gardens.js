var runner = require('./runner')
;

if (module === require.main) {

  config =
    { registries:
      [ { type: 'local', path: __dirname + '/../examples/reg' }
      , { type: 'remote' }
      ]
    , cache_dir: '/Users/simon/.garden'
    , output:    __dirname + '/../examples/hello-world/package.js'
    };
  
  path = __dirname + '/../examples/hello-world/package.json';

  runner(config, path, function(err){
    if (err) throw err;
  });
}