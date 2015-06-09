dust-makara-helpers
===================

Makes it easy to set up the complementary dust `@useContent` and `@message` helpers, with configuration that loads data from `kraken-js`-style `.properties` bundles.

The content lookups are stored in the dust cache if it is enabled.

This module is for server-side use only. `@useContent` and `@message` can be used in the browser, but will need to be configured with other ways to load content.

Use
----

```
var dust = require('dustjs-linkedin');
require('dust-makara-helpers').registerWith(dust, {
    enableMetadata: true
});
```

Options
-------

`enableMetadata`: defaults to `false`. Turns on support for `<edit>` metadata tags in [dust-message-helper] to support in-place content editing.

[dust-message-helper]: https://github.com/krakenjs/dust-message-helper
