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
    if (path.extname(file) == '.less') {
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
    if (!options.stream) {
      if (!options.filename) {
        throw new Error('Must specify either a filename or stream to send CSS to');
      }
      options.stream = fs.createWriteStream(options.filename);
    }
    options.stream.on('finish', function() {
      b.emit('splitlessify:end', options.stream);
    });

    bundle.on('transform', function(tr, file) {
      if (tr._name && tr._name == 'transformLess') {
        lessData += '@import "' + file + '";\n';
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
              options.stream.end(css);
             if (options.callback) {
                process.nextTick(options.callback);
              }
            } catch(e) {
              if (options.errback) {
                process.nextTick(function() {
                  options.errback(e);
                });
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
