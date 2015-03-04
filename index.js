"use strict";
var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spundle = require('spundle');
var dustjacket = require('dustjacket');
var iferr = require('iferr');

module.exports = function(dust, options) {
    options = options || {};

    dustjacket.registerWith(dust);

    dust.addLoadMiddleware(defaultContent);

    usecontent(function(locale, bundle, cb) {
        /* Handle paypal-style or bcp47-style objects */
        var country = locale.country || locale.langtag.region;
        var language = locale.language || locale.langtag.language.language;
        lookupContent(country, language, iferr(cb, function (messages) {
            cb(null, messages[bundle]);
        }));
    }).registerWith(dust);

    message.registerWith(dust);


    function defaultContent(name, context, cb) {
        /* Handle paypal-style or bcp47-style objects */
        var country = context.get('locale.country') || context.get('locale.langtag.region');
        var language = context.get('locale.language') || context.get('locale.langtag.language.language');

        lookupContent(country, language, iferr(cb, function (messages) {
            cb(null, {context: { "intl": {"messages": messages[context.templateName + '.properties'] } }});
        }));
    }

    function lookupContent(country, language, cb) {
        if (!country ) return cb(new Error("no country present"));
        if (!language) return cb(new Error("no language present"));

        spundle(options.localeRoot, country, language, iferr(cb, function (messages) {
            cb(null, messages[[language, country].join('-')]);
        }));
    }
};

module.exports.registerWith = module.exports;
