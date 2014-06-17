var fs = require('fs')
  , path = require('path')
  , less = require('less')
  , through = require('through')
  , chokidar = require('chokidar');

var Splitlessify = function Splitlessify(b, options) {
  if (!options) {
    options = {};
  }
  if (!options.stream && !options.filename) {
    throw new Error('Must specify either a filename or stream to send CSS to');
  }

  var lessParserOptions = options.parser ? options.parser : {}
    , toCSSOptions = options.toCSS ? options.toCSS : {};

  var transformLess = function(file) {
    if (path.extname(file) === '.less' || path.extname(file) === '.css') {
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

  var watcher
    , allImportFilenames
    , topLevelDependencies = {}
    , dependencyTree = {}
    , cssRequirements = {}
    , requirements;

  function regenerate(lessData, emit) {
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

          if (!allImportFilenames) {
            allImportFilenames = Object.keys(allImports).map(function(fn) {
              return path.resolve(fn);
            });
          }
          if (options.watch) {
            if (watcher) {
              watcher.close();
            }
            watcher = chokidar.watch(allImportFilenames);
            watcher.on('change', function(filename) {
              b.emit('splitlessify:update', emit, filename);
            });
          }

          try {
            var css = tree.toCSS(toCSSOptions);
            if (options.stream) {
             options.stream.end(css);
             options.stream.on('finish', function() {
               b.emit('splitlessify:end', emit, allImportFilenames);
             });
            } else if (options.filename) {
              fs.writeFileSync(options.filename, css);
              b.emit('splitlessify:end', emit, allImportFilenames);
            }

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

  b.on('file', function(file, id, parent) {
    if (path.extname(file) === '.less') {
      if (!dependencyTree[parent.filename]) {
        dependencyTree[parent.filename] = {};
      }
      dependencyTree[parent.filename][file] = true;
    } else if (path.extname(file) === '.css') {
      cssRequirements[file] = true;
    }
  });

  b.on('update', function(ids) {
    // when a file gets updated, clear its dependency graph, if it exists
    // we'll reconstruct it on the next bundle event
    ids.forEach(function(id) {
      delete dependencyTree[id];
    });
  });

  // here's where the fun starts. handle bundle events

  b.on('bundle', function(bundle) {
    bundle.on('end', function() {
      // rebuild the top-level import list for less.js
      requirements = {};
      var lessData = '';
      Object.keys(dependencyTree).forEach(function(topLevelDependency) {
        Object.keys(dependencyTree[topLevelDependency]).forEach(function(lessFilename) {
          requirements[lessFilename] = true;
        });
      });
      Object.keys(requirements).forEach(function(lessFilename) {
        lessData += '@import "' + lessFilename + '";\n';
      });
      Object.keys(cssRequirements).forEach(function(cssFilename) {
        lessData += '@import (inline) "' + cssFilename + '";\n';
      });
      regenerate(lessData, bundle);
    });
  });
};

module.exports = function(b, options) {
  return new Splitlessify(b, options);
};
