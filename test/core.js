var should = require('should')
  , browserify = require('browserify')
  , splitlessify = require('../index')
  , fs = require('fs')
  , rmdir = require('rimraf');

describe('splitlessify', function() {
  before(function() {
    try {
      fs.mkdirSync('./test/tmp');
    } catch(e) {
      if (e.code === 'EEXIST') {
        rmdir('./test/tmp/*', function(){});
      } else {
        throw(e);
      }
    }
  });
  after(function() {
    rmdir('./test/tmp', function(){});
  });
  beforeEach(function() {
    b = browserify();
  });

  it('generates a single separate file for require()d CSS files', function(done) {
    b.plugin(splitlessify, {
      filename: './test/tmp/out.css'
    });
    b.add('./test/shims/css/testcss.js');
    b.bundle().on('data', function() {
    }).on('end', function() {
      setTimeout(function() {
        fs.existsSync('./test/tmp/out.css').should.eql(true);

        // check the generated file and make sure it looks the way it's supposed to
        var css = fs.readFileSync('./test/tmp/out.css', { encoding: 'utf-8' });
        css.should.match(/\.foo {/);
        css.should.match(/color: black/);
        css.should.match(/\.bar {/);
        css.should.match(/color: green/);
        done();
      }, 250);
    });
  });

  it('processes LESS files into CSS transparently', function(done) {
     b.plugin(splitlessify, {
      filename: './test/tmp/out_less.css'
    });
    b.add('./test/shims/less/test.js');
    b.bundle().on('data', function() {
    }).on('end', function() {
      setTimeout(function() {
        fs.existsSync('./test/tmp/out_less.css').should.eql(true);

        // check the generated file and make sure it looks the way it's supposed to
        var css = fs.readFileSync('./test/tmp/out_less.css', { encoding: 'utf-8' });
        css.should.match(/\.quux {/);
        css.should.match(/\.greenthing {/);
        css.should.match(/color: green/);
        done();
      }, 250);
    });
  });

  describe('with custom settings', function() {
    it('passes through LESS settings for the parser', function(done) {
      b.plugin(splitlessify, {
        filename: './test/tmp/out_custom.css',
        parser: {
          paths: ['./test/shims/other'],
          relativeUrls: false
        }
      });
      b.add('./test/shims/less/test_custom.js');
      b.bundle().on('data', function() {
      }).on('end', function() {
        setTimeout(function() {
          fs.existsSync('./test/tmp/out_custom.css').should.eql(true);

          // check the generated file and make sure it looks the way it's supposed to
          var css = fs.readFileSync('./test/tmp/out_custom.css', { encoding: 'utf-8' });

          css.should.match(/\.foo {/);
          css.should.match(/\.thingy {/);

          done();
        }, 250);
      });
    });

    it('passes through LESS settings for toCSS', function(done) {
      b.plugin(splitlessify, {
        filename: './test/tmp/out_compress.css',
        toCSS: {
          compress: true
        }
      });
      b.add('./test/shims/less/test.js');
      b.bundle().on('data', function() {
      }).on('end', function() {
        setTimeout(function() {
          fs.existsSync('./test/tmp/out_compress.css').should.eql(true);

          // check the generated file and make sure it looks the way it's supposed to
          var css = fs.readFileSync('./test/tmp/out_compress.css', { encoding: 'utf-8' });
          css.should.match(/\.greenthing{color:green}\.foo{color:green}/m);

          done();
        }, 250);
      });
    });

    it('accepts a callback parameter', function(done) {
      b.plugin(splitlessify, {
        filename: './test/tmp/out_callback.css',
        callback: function() {
          done();
        }
      });
      b.add('./test/shims/less/test.js');
      b.bundle().on('data', function() {});
    });

    it('accepts an errback parameter', function(done) {
      var doneYet = false;
      b.plugin(splitlessify, {
        filename: './test/tmp/out_errback.css',
        errback: function(e) {
          if (!doneYet) {
            done();
            doneYet = true;
          }
        }
      });
      b.add('./test/shims/less/testerror.js');
      b.bundle().on('data', function() {});
    });

  });
});
