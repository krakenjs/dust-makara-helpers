"use strict";
var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spud = require('spud');
var iferr = require('iferr');
var memoize = require('simple-memoize');
var VError = require('verror');
var debug = require('debuglog')('dust-makara-helpers');
var fs = require('fs');
var aproba = require('aproba');

module.exports = function(dust, options) {
    options = options || {};

    debug("registering");

    var autoloadTemplateContent = (options.autoloadTemplateContent == null ? true : options.autoloadTemplateContent);

    debug("will autoload template content? %j", autoloadTemplateContent);

    usecontent(function(ctx, bundle, cb) {
        aproba('OSF', arguments);
        if (!ctx.options || !ctx.options.view) {
            return cb(makeErr(ctx, bundle));
        }

        var locale = localeFromContext(ctx);

        debug("looking up '%s' for template '%s' and locale %j", bundle, ctx.templateName, locale);
        ctx.options.view.lookup(bundle, locale, iferr(cb, function (file) {
            fs.readFile(file, 'utf-8', iferr(cb, function (data) {
                try {
                    cb(null, spud.parse(data));
                } catch (e) {
                    cb(e);
                }
            }));
        }))

    }).registerWith(dust);

    message.registerWith(dust);

    if (autoloadTemplateContent) {
        wrapOnLoad(dust);
    }

    function localeFromContext(ctx) {
        return ctx.get('contextLocale') || ctx.get('contentLocality') ||
            ctx.get('locale') || ctx.get('locality') || {};
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

                debug("wrapping template '%s' to look up default content", tmpl.templateName);
                var newTmpl = function (chunk, ctx) {
                    return chunk.map(function (chunk) {
                        var locale = localeFromContext(ctx);
                        var bundle = tmpl.templateName + '.properties';

                        if (!ctx.options || !ctx.options.view) {
                            return chunk.setError(makeErr(ctx, bundle));
                        }

                        debug("looking up '%s' for template '%s', and locale %j", bundle, tmpl.templateName, locale);
                        dust.helpers.useContent(chunk, ctx, { block: tmpl }, { bundle: bundle }).end();
                    });
                };
                newTmpl.templateName = tmpl.templateName;
                newTmpl.__dustBody = true;

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
     * @param nameOrTemplate {*} Could be:
     *   - the name of a template to load from cache
     *   - a CommonJS-compiled template (a function with a `template` property)
     *   - a template function
     * @return {Function} a template function, if found
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

module.exports.registerWith = module.exports;
