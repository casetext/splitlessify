var fs = require('fs');
var path = require('path');
var less = require('less');
var through = require('through');

var transformLess = function(file) {
  if (path.extname(file) == '.less' || path.extname(file) == '.css') {
    var pipe = through(function(buf) {
    }, function() {
      this.queue('// splitlessify: "' + path.basename(file) + '"');
      this.queue('return null;')
      this.queue(null);
    });
    pipe._name = 'transformLess';
    return pipe;
  } else {
    return through();
  }
};

module.exports = function(b, options) {
  if (!options) {
    options = {};
  }
  var lessParserOptions = options.parser ? options.parser : {};
  var toCSSOptions = options.toCSS ? options.toCSS : {};
  // b is the browserify api object
  b.transform(transformLess);

  b.on('bundle', function(bundle) {
    var lessData = '';

    bundle.on('transform', function(tr, file) {
      if (tr._name && tr._name == 'transformLess') {
        if (path.extname(file) == '.css') {
          lessData += '@import (inline) "' + file + '";\n';
        } else {
          lessData += '@import "' + file + '";\n';
        }
      }
    });

    bundle.on('end', function() {
      // generate css from less
      if (lessData != "") {
        var lessParser = new(less.Parser)(lessParserOptions);
        lessParser.parse(lessData, function (err, tree) {
          if (err) {
            throw err;
          }
          fs.writeFileSync(options.filename, tree.toCSS(toCSSOptions));
        });
      }
    });
  });
};
