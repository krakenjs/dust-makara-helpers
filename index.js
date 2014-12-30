var usecontent = require('dust-usecontent-helper');
var message = require('dust-message-helper');
var spundle = require('spundle');
var iferr = require('iferr');

module.exports = function(dust, options) {
    usecontent(function(locality, bundle, cb) {
        spundle(options.localeRoot, locality.country, locality.language, iferr(cb, function (messages) {
            cb(null, messages[[locality.language, locality.country].join('-')][bundle]);
        }));
    }).registerWith(dust);
    message.registerWith(dust);

};

module.exports.registerWith = module.exports;
