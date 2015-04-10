dust-makara-helpers
===================

Makes it easy to set up the complementary dust `@useContent` and `@message` helpers, with configuration that loads data from `kraken-js`-style `.properties` bundles.

Use
----

```
var dust = require('dustjs-linkedin');
require('dust-makara-helpers').registerWith(dust, {
    localeRoot: __dirname,
    memoize: false
});
```

Options
-------

`localeRoot`: the directory to look in for properties bundles.

`memoize`: defaults to `true`. Prevent looking up content strings on every run.
