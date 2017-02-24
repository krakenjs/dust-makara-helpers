"use strict";
var spud = require('spud');
var iferr = require('iferr');
var VError = require('verror');
var debug = require('debuglog')('dust-makara-helpers');
var fs = require('fs');
var aproba = require('aproba');
var bcp47s = require('bcp47-stringify');
var common = require('./common');
var localeContexts = ['contentLocale', 'contentLocality', 'locale', 'locality']
var localeTransform;
module.exports = function(dust, options) {
    options = options || {};
    localeTransform = (options.useLocaleObject !== undefined && options.useLocaleObject === false) ? localeNoTransform : localeToString;
    localeContexts = options.localeContexts || localeContexts;
    // We bind the loader for the useContent helper here to the express view
    // class's lookup method. It must be the express 5 style one, asynchronous,
    // and for internationalized lookups to work, it must be the backport and
    // extension provided by engine-munger.
    var loader = function(ctx, bundle, cb) {
        aproba('OSF', arguments);

        debug("content request for '%s'", bundle);

        if (!ctx.options || !ctx.options.view) {
            return cb(makeErr(ctx, bundle));
        }

        var locale = localeFromContext(ctx);

        var cacheKey = bundle + '#' + locale;
        if (dust.config.cache && dust.cache[cacheKey]) {
            debug("found in cache at '%s'", cacheKey);
            return cb(null, dust.cache[cacheKey]);
        }

        debug("performing lookup for template '%s' and locale %j", ctx.templateName, locale);
        ctx.options.view.lookup(bundle, { locale: locale }, iferr(cb, function (file) {
            debug("lookup for template '%s' and locale %j gave %j", ctx.templateName, locale, file);
            fs.readFile(file, 'utf-8', iferr(cb, function (data) {
                try {
                    var parsed = spud.parse(data);
                    if (dust.config.cache) {
                        debug("setting cache key '%s' to %j", cacheKey, parsed);
                        dust.cache[cacheKey] = parsed;
                    }

                    cb(null, parsed);
                } catch (e) {
                    cb(e);
                }
            }));
        }));
    };

    common(dust, debug, options, options.loader || loader);


};

function makeErr(ctx, bundle) {
    var str = "no view available rendering template named '%s' and content bundle '%s'";
    debug(str, ctx.templateName, bundle);
    return new VError(str, ctx.templateName, bundle);
}

function localeToString(locale) {
    debug("normalizing locale %j", locale);
    if (!locale) {
        return undefined;
    } else if (typeof locale === 'string') {
        return locale;
    } else if (locale.country && locale.language) {
        return locale.language + '-' + locale.country;
    } else {
        return bcp47s(locale);
    }
}

function localeNoTransform(locale) {
    return locale;   
}
function localeFromContext(ctx) {
    var locale;
    localeContexts.some(function (key) {
        locale = ctx.get(key);
        debug("performing lookup for locale in context key '%s'. Found %j", key, locale);
        return locale !== undefined;
    });
    return localeTransform(locale || {});
}

module.exports.registerWith = module.exports;
