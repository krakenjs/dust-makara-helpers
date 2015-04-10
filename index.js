"use strict";
var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spundle = require('spundle');
var dustjacket = require('dustjacket');
var iferr = require('iferr');
var memoize = require('simple-memoize');

module.exports = function(dust, options) {
    options = options || {};

    var autoloadTemplateContent = (options.autoloadTemplateContent == null ? true : options.autoloadTemplateContent);

    dustjacket.registerWith(dust);

    usecontent(function(locale, bundle, cb) {
        /* Handle paypal-style or bcp47-style objects */
        var country = locale.country || locale.langtag.region;
        var language = locale.language || locale.langtag.language.language;
        lookupContent(country, language, iferr(cb, function (messages) {
            cb(null, messages[bundle]);
        }));
    }).registerWith(dust);

    message.registerWith(dust);

    if (autoloadTemplateContent) {
        replaceRegister(dust);
    }

    var getBundle = options.memoize || options.memoize == null ? memoize(spundle) : spundle;

    function lookupContent(country, language, cb) {
        if (!country ) return cb(new Error("no country present"));
        if (!language) return cb(new Error("no language present"));

        getBundle(options.localeRoot, country, language, iferr(cb, function (messages) {
            cb(null, messages[[language, country].join('-')]);
        }));
    }

    function replaceRegister(dust) {
        var oldregister = dust.register;
        dust.register = function(name, tmpl) {
            oldregister.call(this, name, function (chunk, context) {

                return chunk.map(function (chunk) {
                    /* Handle paypal-style or bcp47-style objects */
                    var country = context.get('locale.country') || context.get('locale.langtag.region');
                    var language = context.get('locale.language') || context.get('locale.langtag.language.language');
                    lookupContent(country, language, function (err, messages) {
                        if (err) {
                            chunk.setError(err);
                        } else {
                            var m = Object.create(context.get('intl.messages') || {});
                            var propfile = name + '.properties';
                            for (var k in messages[propfile]) {
                                m[k] = messages[propfile][k];
                            }

                            var ctx = context.push({ intl: { messages: m } });
                            chunk.render(tmpl, ctx).end();
                        }
                    });
                });
            });
        };
    }
};

module.exports.registerWith = module.exports;
