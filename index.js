var fs = require('fs')
  , path = require('path')
  , less = require('less')
  , through = require('through')
  , chokidar = require('chokidar');

module.exports = function(b, options) {
  if (!options) {
    options = {};
  }
  if (!options.stream && !options.filename) {
    throw new Error('Must specify either a filename or stream to send CSS to');
  }

  var lessParserOptions = options.parser ? options.parser : {}
    , toCSSOptions = options.toCSS ? options.toCSS : {};

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

  function regenerate(lessData, emit) {
    var allImportFilenames = []
      , watcher;

    if (options.filename) {
      options.stream = fs.createWriteStream(options.filename);
    }

    if (lessData !== '') {
      new(less.Parser)(lessParserOptions).parse(lessData, function (err, tree) {
        if (err) {
          if (options.errback) {
            options.errback(err);
          } else {
            throw err;
          }
        } else {
          // traverse the parse tree and find all LESS filenames in this set
          var allImports = {}
            , rules = tree.rules.slice(0);

          while (rules.length > 0) {
            var rule = rules.pop();
            if (rule.root && rule.root.rules && rule.root.rules.length > 0) {
              rules = rules.concat(rule.root.rules);
            }

            if (rule.importedFilename) {
              allImports[rule.importedFilename] = true;
            }
          }

          allImportFilenames = Object.keys(allImports).map(function(fn) {
            return path.resolve(fn);
          });

          options.stream.on('finish', function() {
            b.emit('splitlessify:end', emit, allImportFilenames);
          });

          if (options.watch) {
            if (watcher) {
              watcher.close();
            }
            watcher = chokidar.watch(allImportFilenames);
            watcher.on('change', function(filename) {
              b.emit('splitlessify:update', emit, filename);
              regenerate(lessData, emit);
            });
          }

          try {
            var css = tree.toCSS(toCSSOptions);
            options.stream.end(css);
            if (options.callback) {
              process.nextTick(options.callback.bind(this, allImportFilenames));
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
  }

  // register the transform
  b.transform(transformLess);

  // here's where the fun starts. handle bundle events
  b.on('bundle', function(bundle) {
    var lessData = '';

    bundle.on('transform', function(tr, file) {
      if (tr._name && tr._name == 'transformLess') {
        lessData += '@import "' + file + '";\n';
      }
    });

    bundle.on('end', function() {
      regenerate(lessData, bundle);
    });
  });
};
