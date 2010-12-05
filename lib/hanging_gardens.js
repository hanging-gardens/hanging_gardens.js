var sys      = require('sys')
,   fs       = require('fs')
,   path     = require('path')
,   optparse = require('./optparse')
,   stacks   = require('./stacks')
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
,   VERSION = '0.0.3'
,   option_parser
;


var run
,   usage
,   version
,   compile
,   parse_options
,   setup_stacks

,   load_gardenfile
,   eval_gardenfile
,   map_modules
,   map_module
,   combine_modules
,   render_runtime
,   yuicompress_archive
,   write_archive

,   load_module
,   compile_coffee_script
,   lint_module
,   wrap_module

,   file_type
,   resolve_path
,   normalize_path
;


var map_stacks
,   compile_stack
;

run = exports.run = function(){
  var options
  ;

  options = parse_options();

  if (options.help) {
    return usage();
  }

  if (options.version) {
    return version();
  }

  if (options.arguments.length != 1) {
    return usage();
  }

  setup_stacks();

  if (options.watch) {
    return watch(options);
  }

  return compile(options);
}

usage = function(){
  sys.puts(option_parser.help());
  return process.exit(0);
};

version = function() {
  sys.puts("Hanging Gardens version " + VERSION);
  return process.exit(0);
};

compile = function(options){
  compile_stack({ options: options }, function(ctx){
    process.exit(0);
  });
};

watch = function(options){
  var ctx
  ,   clb
  ,   compile
  ;

  ctx = { options: options, watch: true };

  clb = function(ctx){
    ctx.compiling = false;

    console.log('');

    if (ctx.rerun) {
      compile(ctx);
      return;
    }

    ctx.watch_files.forEach(function(f){
      fs.watchFile(f, { interval: 100 }, function(curr, prev){
        if (curr.mtime > prev.mtime) { compile(ctx); }
      });
    });
  };

  compile = function(ctx){
    if (ctx.compiling) {
      ctx.rerun = true;
      return;
    }

    ctx.rerun     = false;
    ctx.compiling = true;

    if (ctx.watch_files) {
      ctx.watch_files.forEach(function(f){
        fs.unwatchFile(f);
      });
    }

    ctx.watch_files = [];

    compile_stack(ctx, clb);
  };

  compile(ctx);
};

parse_options = function(){
  option_parser = new optparse.OptionParser(SWITCHES, BANNER);
  return option_parser.parse(process.argv.slice(2, process.argv.length));
};

setup_stacks = function(){
  map_stacks =
  { '.js'     : stacks.serial(
                [ load_module
                , lint_module
                , wrap_module
                ])
  , '.coffee' : stacks.serial(
                [ load_module
                , compile_coffee_script
                , lint_module
                , wrap_module
                ])
  };

  compile_stack = stacks.serial(
                  [ load_gardenfile
                  , eval_gardenfile
                  , map_modules
                  , combine_modules
                  , render_runtime
                  , yuicompress_archive
                  , write_archive
                  ]);
};



load_gardenfile = function(ctx, clb){
  fs.realpath(ctx.options.arguments[0], function(err, gardenfile_path){
    if (err) throw err;

    ctx.gardenfile_path = gardenfile_path;
    ctx.root_dir        = path.dirname(gardenfile_path);

    if (ctx.watch) {
      ctx.watch_files.push(gardenfile_path);
      ctx.watch_files.push(path.join(ctx.root_dir, 'vendor'));
      ctx.watch_files.push(path.join(ctx.root_dir, 'behaviours'));
      ctx.watch_files.push(path.join(ctx.root_dir, 'helpers'));
      ctx.watch_files.push(path.join(ctx.root_dir, 'widgets'));
    }

    if (!ctx.options.output) {
      ctx.options.output = path.join(
        ctx.root_dir, 'Gardenfile.compiled.js');
    }

    fs.readFile(gardenfile_path, function(err, data){
      if (err) throw err;

      ctx.gardenfile_src = data.toString();
      clb(ctx);
    });
  });
};

eval_gardenfile = function(ctx, clb){
  var sandbox
  ,   configure_lint
  ,   configure_yuicompressor
  ,   register_vendor_paths
  ,   register_behaviour_paths
  ,   register_helper_paths
  ,   register_widgets_paths
  ,   name
  ;

  configure_lint = function(options){
    var i
    ;

    ctx.lint_enabled = true;
    ctx.lint_options = options || {};
    ctx.lint_options.skip = ctx.lint_options.skip || [];

    for (i in ctx.lint_options.skip) {
      ctx.lint_options.skip[i] = normalize_path(ctx.lint_options.skip[i]);
    }
  };

  configure_yuicompressor = function(){
    ctx.yuicompress_enabled = true;
  };

  register_vendor_paths = function(paths){
    var name, type, path, wrapper;
    for (path in paths) {
      wrapper = paths[path];
      path = 'vendor/'+path;
      name = normalize_path(path);
      path = resolve_path(ctx, path);
      type = file_type(path);
      ctx.modules[name] = { path: path, type: type, name: name, wrapper: wrapper };
    }
  };

  register_behaviour_paths = function(paths){
    var name, type, path, i;
    for (i in paths) {
      path = 'behaviours/'+paths[i];
      name = normalize_path(path);
      path = resolve_path(ctx, path);
      type = file_type(path);
      ctx.modules[name] = { path: path, type: type, name: name };
    }
  };

  register_helper_paths = function(paths){
    var name, type, path, i;
    for (i in paths) {
      path = 'helpers/'+paths[i];
      name = normalize_path(path);
      path = resolve_path(ctx, path);
      type = file_type(path);
      ctx.modules[name] = { path: path, type: type, name: name };
    }
  };

  register_widgets_paths = function(paths){
    var name, type, path, i;
    for (i in paths) {
      path = 'widgets/'+paths[i];
      name = normalize_path(path);
      path = resolve_path(ctx, path);
      type = file_type(path);
      ctx.modules[name] = { path: path, type: type, name: name };
    }
  };

  ctx.modules = {};

  sandbox =
  { vendor:        register_vendor_paths
  , behaviours:    register_behaviour_paths
  , helpers:       register_helper_paths
  , widgets:       register_widgets_paths
  , lint:          configure_lint
  , yuicompressor: configure_yuicompressor
  };

  Script.runInNewContext(
    ctx.gardenfile_src, sandbox, ctx.gardenfile_path);

  clb(ctx);
};

map_modules = function(ctx, clb){
  var name
  ;

  ctx.queue = [];

  for (name in ctx.modules) {
    ctx.queue.push(name);
  }

  map_module(ctx, clb);
};

map_module = function(ctx, clb){
  if (ctx.queue.length == 0) {
    clb(ctx);
    return;
  }

  var name
  ,   module
  ,   stack
  ;

  name   = ctx.queue.shift();
  module = ctx.modules[name];
  stack  = map_stacks[module.type];

  ctx.module = module;

  console.log("===[Garden] "+name);

  if (!module.path) {
    console.log("File not found: "+module.name);
    map_module(ctx, clb);
    return;
  }

  if (ctx.watch) {
    ctx.watch_files.push(module.path);
  }

  stack(ctx, function(ctx){
    console.log('');
    map_module(ctx, clb);
  });
};

load_module = function(ctx, clb){
  var module
  ;

  module = ctx.module;

  fs.readFile(module.path, function(err, data){
    if (err) throw err;

    module.source = data.toString();

    clb(ctx);
  });
};

compile_coffee_script = function(ctx, clb){
  var module
  ,   js = ""
  ,   cmd
  ;

  module = ctx.module;

  console.log('---[Coffee]');

  cmd = spawn('coffee', ['--print', '--stdio', '--bare']);
  cmd.stdout.on('data', function(d){ js += d.toString(); });
  cmd.stderr.on('data', function(d){ console.log(d.toString().trim()); });
  cmd.stdin.write(module.source);
  cmd.stdin.end();

  cmd.on('exit', function(code){
    if (code > 0) {
      console.log('Coffee Script failed ['+code+'].');
      process.exit(1);
    } else {
      module.source = js;
      clb(ctx);
    }
  });
};

lint_module = function(ctx, clb){
  var module
  ,   cmd
  ,   print_it
  ,   jsl_conf
  ;

  if (!ctx.lint_enabled) {
    clb(ctx);
    return;
  }

  module = ctx.module;

  if (ctx.lint_options.skip.indexOf(module.name) >= 0) {
    console.log('---[JSLint]\n[SKIPED]');
    clb(ctx);
    return;
  }

  console.log('---[JSLint]');

  print_it = function(d){ console.log(d.toString().trim()); };
  jsl_conf = __dirname + '/../extras/jsl.conf';

  cmd = spawn('jsl', ['-nologo', '-stdin', '-conf', jsl_conf]);
  cmd.stdout.on('data', print_it);
  cmd.stderr.on('data', print_it);
  cmd.stdin.write(module.source);
  cmd.stdin.end();

  cmd.on('exit', function(code){
    if (code >= 2) {
      console.log('JSLint failed ['+code+'].');
    } else {
      clb(ctx);
    }
  });
};

wrap_module = function(ctx, clb){
  var module
  ,   wrapper
  ,   source
  ;

  module  = ctx.module;
  source  = module.source;
  wrapper = module.wrapper;

  if (typeof wrapper == 'string') {
    source = wrapper.replace('__GARDEN_MODULE__', '\n'+source+'\n');
  }

  source = '(function(module, require, window, document, console, screen, history, location, undefined){'+
           'var exports = module["exports"];'+
           source+
           '\nmodule["exports"] = exports;'+
           '})';

  module.source = source;

  clb(ctx);
};

combine_modules = function(ctx, clb){
  var name
  ,   module
  ,   archive = []
  ;

  console.log("+++[Archiving]");

  for (name in ctx.modules) {
    module = ctx.modules[name];
    archive.push('"'+name+'":'+module.source);
  }

  archive = '{' + archive.join(',\n') + '}';
  ctx.archive = archive;

  clb(ctx);
};

render_runtime = function(ctx, clb){
  var runtime_path
  ;

  runtime_path = path.join(__dirname, 'runtime.js');
  fs.readFile(runtime_path, function(err, data){
    if (err) throw err;

    data = data.toString();
    data = data.replace('__MODULES__', ctx.archive);

    ctx.archive = data;

    clb(ctx);
  });
};

yuicompress_archive = function(ctx, clb){
  var data = ""
  ,   cmd
  ,   tmp_file
  ;

  if (!ctx.yuicompress_enabled) {
    clb(ctx);
    return;
  }

  console.log("+++[YUI Compressor]");

  tmp_file = '/tmp/yui-compress-'+Math.random()+'.js';
  fs.writeFile(tmp_file, ctx.archive, function(err){
    if (err) throw err;

    cmd = spawn('yuicompressor', [tmp_file]);
    cmd.stdout.on('data', function(d){ data += d.toString(); });
    cmd.stderr.on('data', function(d){ console.log(d.toString().trim()); });
    cmd.stdin.end();

    cmd.on('exit', function(code){
      fs.unlink(tmp_file);
      if (code > 0) {
        console.log('YUI Compressor failed ['+code+'].');
      } else {
        ctx.archive = data.toString();
        clb(ctx);
      }
    });
  });
};

write_archive = function(ctx, clb){
  fs.writeFile(ctx.options.output, ctx.archive, function(err){
    if (err) throw err;

    console.log("+++[Updated]\n"+ctx.options.output);

    clb(ctx);
  });
};


file_type = function(p){
  if (!p) return null;
  return path.extname(p);
}

resolve_path = function(ctx, p){
  var ext
  ,   exts = ['.js', '.coffee', '']
  ,   fp
  ,   i
  ;

  p   = path.normalize(path.join(ctx.root_dir, p));
  for (i in exts) {
    fp = p + exts[i];
    try {
      fs.statSync(fp);
      return path.normalize(fp);
    }
    catch (e) {

    }
  }

  return null;
};

normalize_path = function(p){
  p = path.normalize(
      path.join(
      path.dirname(p),
      path.basename(p,
      path.extname(p))));
  return p;
};
