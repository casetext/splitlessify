var browserify = require('browserify');
var splitlessify = require('./splitlessify');

var b = browserify();

b.add('./browsertest.js');
b.plugin(splitlessify, {
  filename: "foo.css"
});

var bundle = b.bundle();
bundle.pipe(process.stdout);
