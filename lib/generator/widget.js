
exports.need_project = true;
exports.run = function(g, argv){
  if (argv.length != 1) {
    console.log("Usage: garden g widget NAME");
    process.exit(1);
  }

  g.file(['widgets', argv[0]+".js"],
         '// var document = require("browser/document");');
};
