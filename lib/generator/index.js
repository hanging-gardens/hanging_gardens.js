
var Generator
,   _ensure_path
;

module.exports = function(argv) {
  var g
  ,   m
  ,   p
  ;

  type = argv.shift();
  try { m = require('./'+type); } catch (e) {}
  if (!m) {
    console.log('Usage: garden g website|behaviour|helper|widget');
    process.exit(1);
  }

  if (m.need_project) {
    try { p = fs.realpathSync('package.json') } catch(e) {}
    if (!p) {
      console.log('Please run this comman in a project directory');
      process.exit(1);
    }
  } else {
    if (!argv[0]) {
      console.log('Usage: garden g '+type+' PROJECT_NAME');
      process.exit(1);
    }
    p = path.normalize(path.join(argv[0]));
    argv.shift();
  }

  g = new Generator(p);
  _ensure_path(g.root);

  m.run(g, argv);
};

Generator = function(root){
  this.root = root;
};

Generator.prototype.dir = function(dirname){
  _ensure_path(path.join(this.root, dirname));
};

Generator.prototype.file = function(filename, content){
  content = content || '';
  this.dir(path.dirname(filename));
  filename = path.normalize(path.join(this.root, filename));
  fs.writeFileSync(filename, content);
};

Generator.prototype.package = function(info){
  var filename = 'package.json';
  var content  = JSON.stringify(info);
  this.dir(path.dirname(filename));
  filename = path.normalize(path.join(this.root, filename));
  fs.writeFileSync(filename, content);
};

_ensure_path = function(dirname){
  try {
    fs.realpathSync(dirname);
  } catch(e) {
    this.dir(path.join(dirname, '..'));
    dirname = path.normalize(dirname);
    fs.mkdirSync(dirname, 0755);
  }
};