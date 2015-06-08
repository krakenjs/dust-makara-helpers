dust-makara-helpers
===================

Makes it easy to set up the complementary dust `@useContent` and `@message` helpers, with configuration that loads data from `kraken-js`-style `.properties` bundles.

Use
----

```
var dust = require('dustjs-linkedin');
require('dust-makara-helpers').registerWith(dust, {
    localeRoot: __dirname,
    enableMetadata: true,
    memoize: false
});
```

Options
-------

`localeRoot`: the directory to look in for properties bundles.

`memoize`: defaults to `true`. Prevent looking up content strings on every run.

`enableMetadata`: defaults to `false`. Turns on support for `<edit>` metadata tags in [dust-message-helper]

[dust-message-helper]: https://github.com/krakenjs/dust-message-helper
