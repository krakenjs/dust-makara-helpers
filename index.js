var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spundle = require('spundle');
var iferr = require('iferr');

module.exports = function(dust, options) {
    options = options || {};

    usecontent(function(locale, bundle, cb) {
        /* Handle paypal-style or bcp47-style objects */
        var country = locale.country || locale.langtag.region;
        var language = locale.language || locale.langtag.language.language;
        if (!country ) return cb(new Error("no country present"));
        if (!language) return cb(new Error("no language present"));
        spundle(options.localeRoot, country, language, iferr(cb, function (messages) {
            cb(null, messages[[language, country].join('-')][bundle]);
        }));
    }).registerWith(dust);
    message.registerWith(dust);

};

module.exports.registerWith = module.exports;
