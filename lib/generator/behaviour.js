
exports.need_project = true;
exports.run = function(g, argv){
  if (argv.length != 1) {
    console.log("Usage: garden g behaviour NAME");
    process.exit(1);
  }

  g.file(['behaviours', argv[0]+".js"],
         '// var document = require("browser/document");');
};
