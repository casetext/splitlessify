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

### options

#### filename
type ```[string]```: where to output the CSS file that will satisfy all the bundle's LESS dependencies.

#### parser
type ```[object]```: options to pass to ```new less.Parser``` (you can set ```paths``` here, for instance)

#### toCSS
type [object]: options to pass to ```tree.toCSS``` (you can set ```compress: true``` here, for instance)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

Test your changes with the following command:

```
npm test
```

Add tests for any new functionality.

## Release History

### v0.1.0
  - Initial release

# license

MIT
