var fs = require('fs')
  , path = require('path')
  , less = require('less')
  , through = require('through');

module.exports = function(b, options) {
  if (!options) {
    options = {};
  }

  var lessParserOptions = options.parser ? options.parser : {}
    , toCSSOptions = options.toCSS ? options.toCSS : {}
    , lessParser = new(less.Parser)(lessParserOptions);


  var transformLess = function(file) {
    if (path.extname(file) == '.less' || path.extname(file) == '.css') {
      var pipe = through(function() {}, function() {
        this.queue('// splitlessify: "' + path.basename(file) + '"');
        this.queue(null);
      });
      pipe._name = 'transformLess';
      return pipe;
    } else {
      return through();
    }
  };

  // register the transform
  b.transform(transformLess);

  // here's where the fun starts. handle bundle events
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
      if (lessData !== '') {
          lessParser.parse(lessData, function (err, tree) {
          if (err) {
            if (options.errback) {
              options.errback(err);
            } else {
              throw err;
            }
          } else {
            try {
              var css = tree.toCSS(toCSSOptions);
              fs.writeFileSync(options.filename, css);
              if (options.callback) {
                options.callback();
              }
            } catch(e) {
              if (options.errback) {
                options.errback(e);
              } else {
                throw(e);
              }
            }
          }
        });
      }
    });
  });
};
