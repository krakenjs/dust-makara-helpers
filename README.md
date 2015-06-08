dust-makara-helpers
===================

Makes it easy to set up the complementary dust `@useContent` and `@message` helpers, with configuration that loads data from `kraken-js`-style `.properties` bundles.

The content lookups are stored in the dust cache if it is enabled.

Use
----

```
var dust = require('dustjs-linkedin');
require('dust-makara-helpers').registerWith(dust, {
    localeRoot: __dirname,
    enableMetadata: true
});
```

Options
-------

`localeRoot`: the directory to look in for properties bundles.

`enableMetadata`: defaults to `false`. Turns on support for `<edit>` metadata tags in [dust-message-helper]

[dust-message-helper]: https://github.com/krakenjs/dust-message-helper
