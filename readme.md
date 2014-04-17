[![NPM version](https://badge.fury.io/js/splitlessify.png)](http://badge.fury.io/js/splitlessify)

# splitlessify

Create a separate .css file for your Less.js dependencies during bundling.

## install

With [npm](http://npmjs.org) do:

```
npm install splitlessify --save-dev
```

## use

```js
var b = require('browserify')
  , options = {...};

b.plugin('splitlessify', options);
```

### events
  - 'splitlessify:end' - triggered on the browserify object when the CSS is finished writing.
  - 'splitlessify:watch' - triggered on the browserify object when one of the CSS files in the dependency graph changes (only if options.watch is set).

### options

#### watch
 - type [boolean] if set, splitlessify watches changes to the Less dependency graph and regenerates the CSS output when necessary 

#### stream
 - type [readable.Stream] a stream to which the output CSS will be written

#### filename
 - type [string] path to a file where splitlessify will write the output CSS

#### parser
 - type [object] options to pass to ```new less.Parser```

#### toCSS
 - type [object] options to pass to ```tree.toCSS``` (you can set ```compress: true``` here, for instance)

#### callback
 - type [function] This function will be called on successful creation of a CSS bundle. It passes no arguments.

#### errback
 - type [function] This function will be called if an error is encountered during CSS bundling, such as a parse error. If not set, exceptions are raised on errors.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

Test your changes with the following command:

```
npm test
```

Add tests for any new functionality.

## Release History

### v0.4.2
  - Fixed up some cruft in package.json

### v0.4.1
  - improved watching semantics

### v0.4.0
  - options.watch and browserify 'splitlessify:update' event added

### v0.3.0
  - options.stream and browserify 'splitlessify:end' event added

### v0.2.2
  - Use process.nextTick to call callbacks so they're properly asynchronous

### v0.2.1
  - Added browserify-plugin tag to package.json

### v0.2.0
  - Added callback and errback options

### v0.1.0
  - Initial release

# license

MIT
