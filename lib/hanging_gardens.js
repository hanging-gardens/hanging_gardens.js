var sys      = require('sys')
,   fs       = require('fs')
,   path     = require('path')
,   optparse = require('./optparse')
,   Script   = process.binding('evals').Script
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
;


var run
,   usage
,   version
,   compile
,   parse_options
,   read_gardenfile
,   eval_gardenfile
,   combine_modules
,   render_runtime
,   write_output
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

    source = '(function(module){ var exports = module["exports"], require = module["require"]; \n__GARDEN_MODULE__\n ; module["exports"] = exports; })'.
             replace('__GARDEN_MODULE__', source);

    module.source = source;
  }

  combine_modules();
};

combine_modules = function(){
  var module_name
  ,   module
  ,   combined_modules = []
  ;

  for (module_name in registerd_modules) {
    module = registerd_modules[module_name];

    combined_modules.push('"'+module_name+'":{"container":'+module.source+'}');
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
