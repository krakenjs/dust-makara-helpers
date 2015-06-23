"use strict";
var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spud = require('spud');
var iferr = require('iferr');
var VError = require('verror');
var debug = require('debuglog')('dust-makara-helpers');
var fs = require('fs');
var aproba = require('aproba');
var bcp47s = require('bcp47-stringify');

module.exports = function(dust, options) {
    options = options || {};

    debug("registering");

    // Default to true, but since it imposes some complexity and lack of clarity,
    // about where things come from in the templates, allow it to be disabled.
    var autoloadTemplateContent = options.autoloadTemplateContent == null || options.autoloadTemplateContent;

    debug("will autoload template content? %j", autoloadTemplateContent);

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
        }))
    };

    usecontent.withLoader(loader).registerWith(dust);

    // The message helper is the main user surface from the template side.
    message.registerWith(dust, { enableMetadata: options.enableMetadata });

    // Here's where the dirty bit of auto-wrapping templates with the content
    // load is triggered.
    if (autoloadTemplateContent) {
        wrapOnLoad(dust);
    }

    function localeFromContext(ctx) {
        // Handle all the backward compatibility names (*Locality) and the new
        // ones, too.
        return stringLocale(ctx.get('contextLocale') || ctx.get('contentLocality') ||
            ctx.get('locale') || ctx.get('locality') || {});
    }

    // This is where the magic lies. To get a hook on templates and wrap them with
    // javascript that is aware of the template's name
    function wrapOnLoad(dust) {
        var oldOnLoad = dust.onLoad;

        if (!oldOnLoad) {
            throw new Error("dust.onLoad must be configured to use automatic content loading");
        }

        debug("wrapping onLoad function to support content autoloading");

        dust.onLoad = function(name, options, cb) {

            var ourLoader = iferr(cb, function (srcOrTemplate) {
                debug("got template %s", srcOrTemplate);

                var tmpl = getTemplate(srcOrTemplate);
                if (!tmpl) {
                    debug("Compiling template '%s'", name);
                    tmpl = dust.loadSource(dust.compile(srcOrTemplate, name));
                }

                if (tmpl.loadsDefaultContent) {
                    newTmpl = tmpl;
                } else {
                    debug("wrapping template '%s' to look up default content", tmpl.templateName);
                    var newTmpl = function (chunk, ctx) {
                        return chunk.map(function (chunk) {
                            var locale = localeFromContext(ctx);
                            var bundle = tmpl.templateName + '.properties';

                            loader(ctx, bundle, function (err, content) {
                                if (err) {
                                    chunk.setError(err);
                                } else {
                                    hackGibson(ctx, content, bundle);
                                    dust.helpers.useContent(chunk, ctx, { block: tmpl }, { bundle: bundle }).end();
                                }
                            });
                        });
                    };
                    newTmpl.templateName = tmpl.templateName;
                    newTmpl.loadsDefaultContent = true;
                    newTmpl.__dustBody = true;
                }

                if (dust.config.cache) {
                    // This actually replaces the template registered by
                    // compiling and loading above.
                    dust.cache[tmpl.templateName] = newTmpl;
                }

                cb(null, newTmpl);
            });

            debug("calling old onLoad to get template '%s'", name);
            if (oldOnLoad.length == 2) {
                return oldOnLoad.call(this, name, ourLoader);
            } else {
                return oldOnLoad.call(this, name, options, ourLoader);
            }
        };
    }

    /**
     * Extracts a template function (body_0) from whatever is passed.
     *
     * This is an extract of the same function from the dustjs source.
     *
     *  nameOrTemplate Could be:
     *   - the name of a template to load from cache
     *   - a CommonJS-compiled template (a function with a `template` property)
     *   - a template function
     * returns a template function, if found
     */
    function getTemplate(nameOrTemplate) {
        if(!nameOrTemplate) {
            return;
        }
        if(typeof nameOrTemplate === 'function' && nameOrTemplate.template) {
            // Sugar away CommonJS module templates
            return nameOrTemplate.template;
        }
        if(dust.isTemplateFn(nameOrTemplate)) {
            // Template functions passed directly
            return nameOrTemplate;
        }
    }
};

function makeErr(ctx, bundle) {
    var str = "no view available rendering template named '%s' and content bundle '%s'";
    debug(str, ctx.templateName, bundle);
    return new VError(str, ctx.templateName, bundle);
}

function stringLocale(locale) {
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

function hackGibson(ctx, content, bundle) {
    var oldShiftBlocks = ctx.shiftBlocks;
    var oldPush = ctx.push;

    // Alter the context to wrap each block shifted, so content will be
    // present even in blocks rendered from other templates like layouts.
    ctx.shiftBlocks = function(locals) {
        return oldShiftBlocks.call(this, objMap(locals, function (l) {
            return wrapBlock(l, content, bundle);
        }));
    };

    // Alter the context to apply this same alteration to each context
    // pushed below this one, maintaining this hack for all future
    // context pushes.
    ctx.push = function(head, idx, len) {
        var newCtx = oldPush.apply(this, arguments);
        hackGibson(newCtx, content, bundle);
        return newCtx;
    };
}

function wrapBlock(block, content, bundle) {
    // Return a block that re-pushes the content, and then passes to
    // the original block. This makes sure the content is associated
    // with the auto-loaded content bundle, not coming from the calling
    // context, which could be a different template and have the wrong
    // content loaded.
    return function (chunk, ctx) {
        ctx = ctx.push({intl: { messages: content, bundle: bundle }});
        return block(chunk, ctx);
    }
}

function objMap(obj, fn) {
    var n = {};
    Object.keys(obj).forEach(function (e) {
        n[e] = fn(obj[e]);
    });
    return n;
}

module.exports.registerWith = module.exports;
