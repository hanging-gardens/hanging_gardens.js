var sys      = require('sys')
,   fs       = require('fs')
,   path     = require('path')
,   optparse = require('./optparse')
,   Script   = process.binding('evals').Script
,   spawn    = require('child_process').spawn
;


var SWITCHES =
    [ ['-o', '--output [FILE]', 'set the path for the compiled JavaScript']
    , ['-w', '--watch', 'watch scripts for changes, and recompile']
    // , ['-p', '--print', 'print the compiled JavaScript to stdout']
    , ['-v', '--version', 'display CoffeeScript version']
    , ['-h', '--help', 'display this help message']
    ]
,   BANNER = 'garden packages a Hanging Gardens project.\n\n'+
             'Usage:\n  garden path/to/Gardenfile.js'
,   VERSION = '0.0.1'
,   options
,   option_parser
,   registerd_modules
,   lint_enabled
,   lint_options
;


var run
,   usage
,   version
,   compile
,   parse_options
,   read_gardenfile
,   eval_gardenfile
,   lint_modules
,   lint_module
,   combine_modules
,   render_runtime
,   write_output
,   configure_lint
,   register_vendor_paths
,   register_behaviour_paths
,   register_helper_paths
,   register_widgets_paths
,   normalize_path
,   watch_tree
;


run = exports.run = function(){
  parse_options();

  if (options.help) {
    return usage();
  }

  if (options.version) {
    return version();
  }

  if (options.arguments.length != 1) {
    return usage();
  }

  if (options.watch) {
    return watch();
  }

  return compile();
}

usage = function(){
  sys.puts(option_parser.help());
  return process.exit(0);
};

version = function() {
  sys.puts("Hanging Gardens version " + VERSION);
  return process.exit(0);
};

compile = function(){
  read_gardenfile();
};

watch = function(){
  var gardenfile
  ,   root_dir
  ,   code
  ;

  gardenfile = fs.realpathSync(options.arguments[0]);
  root_dir   = path.dirname(gardenfile);
  options.output = options.output || path.join(root_dir, 'Gardenfile.compiled.js');

  watch_tree(root_dir, function(p, curr, prev){
    if (curr.mtime > prev.mtime) {
      console.log('Compiling: '+p.toString());
      compile();
    }
  });
}

parse_options = function(){
  option_parser = new optparse.OptionParser(SWITCHES, BANNER);
  options = option_parser.parse(process.argv.slice(2, process.argv.length));
};

read_gardenfile = function(){
  var gardenfile
  ,   root_dir
  ,   code
  ;

  gardenfile = fs.realpathSync(options.arguments[0]);
  root_dir   = path.dirname(gardenfile);
  options.output = options.output || path.join(root_dir, 'Gardenfile.compiled.js');

  code = fs.readFileSync(gardenfile);
  eval_gardenfile(code, root_dir, gardenfile);
};

eval_gardenfile = function(code, root_dir, gardenfile){
  var ctx = { vendor:     register_vendor_paths
            , behaviours: register_behaviour_paths
            , helpers:    register_helper_paths
            , widgets:    register_widgets_paths
            , lint:       configure_lint
            }
  ,   module
  ,   module_name
  ,   source
  ;

  registerd_modules = {};

  Script.runInNewContext(code, ctx, gardenfile);

  for (module_name in registerd_modules) {
    module = registerd_modules[module_name];
    module.path = path.join(root_dir, module_name);
    source = fs.readFileSync(module.path);

    if (typeof module.wrapper == 'string') {
      source = module.wrapper.replace('__GARDEN_MODULE__', '\n'+source+'\n');
      delete module['wrapper'];
    }

    source = '(function(module){ var exports = module["exports"], require = module["require"]; \n__GARDEN_MODULE__\n module["exports"] = exports; })'.
             replace('__GARDEN_MODULE__', source);

    module.source = source;
  }

  if (lint_enabled){
    lint_modules(function(){
      combine_modules();
    });
  } else {
    combine_modules();
  }
};


lint_modules = function(callback){
  var module_name
  ,   module
  ,   jsl_conf
  ,   jsl
  ,   print_it
  ,   modules = []
  ;
  
  jsl_conf = __dirname + '/../extras/jsl.conf';
  
  print_it = function(buffer) {
    return console.log(buffer.toString().trim());
  };
  
  for (module_name in registerd_modules) {
    modules.push([module_name, registerd_modules[module_name]]);
  }
  
  lint_module(modules, jsl_conf, print_it, callback);
};

lint_module = function(modules, jsl_conf, print_it, callback){
  var module_name
  ,   module
  ,   jsl
  ;
  
  if (modules.length == 0) {
    callback();
    return;
  }
  
  module_name = modules[0][0];
  module      = modules[0][1];
  modules.shift();
  
  if (lint_options.skip.indexOf(module_name) >= 0) {
    console.log('=== '+module_name + '\n[SKIPED]');
    lint_module(modules, jsl_conf, print_it, callback);
    return;
  }
  
  console.log('=== '+module_name);
  
  jsl = spawn('jsl', ['-nologo', '-stdin', '-conf', jsl_conf]);
  jsl.stdout.on('data', print_it);
  jsl.stderr.on('data', print_it);
  jsl.stdin.write(module.source+';');
  jsl.stdin.end();
  
  jsl.on('exit', function(code){
    if (code >= 2) {
      console.log('JSLint failed ['+code+']: there were problems with your js files.');
      process.exit(1);
    } else {
      lint_module(modules, jsl_conf, print_it, callback);
    }
  });
};

combine_modules = function(){
  var module_name
  ,   module
  ,   combined_modules = []
  ;

  for (module_name in registerd_modules) {
    module = registerd_modules[module_name];

    combined_modules.push(
      '"'+module_name+'":{"container":'+module.source+'}');
  }

  combined_modules = '{' + combined_modules.join(',\n') + '}';

  render_runtime(combined_modules);
};

render_runtime = function(combined_modules){
  var runtime
  ,   combined_source
  ;

  runtime = path.join(path.dirname(
              fs.realpathSync(__filename)), 'runtime.js');
  runtime = fs.readFileSync(runtime).toString();

  combined_source = runtime.replace('__MODULES__', combined_modules);

  write_output(combined_source);
};

write_output = function(combined_source){
  fs.writeFileSync(options.output, combined_source);
};

configure_lint = function(options){
  var i
  ;
  
  lint_enabled = true;
  lint_options = options;
  lint_options.skip = lint_options.skip || [];
  
  for (i in lint_options.skip) {
    lint_options.skip[i] = normalize_path(lint_options.skip[i]);
  }
};

register_vendor_paths = function(paths){
  var path, wrapper;
  for (path in paths) {
    wrapper = paths[path];
    path = 'vendor/'+normalize_path(path);
    registerd_modules[path] = { wrapper: wrapper };
  }
};

register_behaviour_paths = function(paths){
  var path, i;
  for (i in paths) {
    path = paths[i];
    path = 'behaviours/'+normalize_path(path);
    registerd_modules[path] = {};
  }
};

register_helper_paths = function(paths){
  var path, i;
  for (i in paths) {
    path = paths[i];
    path = 'helpers/'+normalize_path(path);
    registerd_modules[path] = {};
  }
};

register_widgets_paths = function(paths){
  var path, i;
  for (i in paths) {
    path = paths[i];
    path = 'widgets/'+normalize_path(path);
    registerd_modules[path] = {};
  }
};

normalize_path = function(p){
  p = p.replace(/(\.js)?$/, '.js');
  p = p.replace(/\/\//g, '/');
  p = p.replace(/^\.\//, '');
  p = path.normalize(p)
  return p;
};

watch_tree = function(wpath, clb){
  var stat
  ,   children
  ,   idx
  ;

  if (wpath == options.output) return;

  stat = fs.statSync(wpath);
  if (!stat) return;

  fs.watchFile(wpath, function(curr, prev) { clb(wpath, curr, prev) });

  if (stat.isDirectory()) {
    children = fs.readdirSync(wpath);
    for (idx in children) {
      watch_tree(path.join(wpath, children[idx]), clb);
    }
  }
};
