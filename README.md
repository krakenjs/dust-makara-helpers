dust-makara-helpers
===================

Makes it easy to set up the complementary dust `@useContent` and `@message` helpers, with configuration that loads data from `kraken-js`-style `.properties` bundles.

The content lookups are stored in the dust cache if it is enabled.

This module requires the full build of dust, with the compiler, since the `@message` helper compiles strings with dust.

`@useContent` and `@message` can be used in the browser, but will need to be configured with other ways to load content, such as using requirejs.

Use
----

```js
var dust = require('dustjs-linkedin');
require('dust-makara-helpers').registerWith(dust, {
    enableMetadata: true,
    autoloadTemplateContent: false,
    useLocaleObject: true,
    localeContexts: ["makaraLocale"]
});
```

Options
-------

* `enableMetadata`: defaults to `false`. Turns on support for `<edit>` metadata tags in [dust-message-helper] to support in-place content editing.
* `autoloadTemplateContent`: defaults to `true`. Allows you to disable automatic loading of content per template, allowing you to have a completely disjoint mapping between templates and content bundles, rather than a 1:1 mapping of template name to content bundle filename.
* `useLocaleObject`: defaults to `false`. Setting to true prevents the conversion of locale to a string. This is a way to allow you to use non-standard locales but in a bcp47 format.
* `localeContexts`: Array of Strings. defaults to an array of expected context keys for the locale object. You can override that array if you have a different key, or set of keys, where you want to search for the locales.

[dust-message-helper]: https://github.com/krakenjs/dust-message-helper
