"use strict";
var makarahelpers = require('../');
var test = require('tap').test;
var path = require('path');
var fs = require('fs');
var freshy = require('freshy').freshy;
var makeViewClass = require('engine-munger');
var View = makeViewClass({
    properties: {
        root: path.resolve(__dirname, 'fixtures'),
        i18n: {
            fallback: 'en-US',
            formatPath: function (locale) {
                return path.join(locale.langtag.region, locale.langtag.language.language);
            }
        }
    }
});

function render(dust, name, context, cb) {
    var ctx = dust.context(context, { view: new View(name + '.dust', { engines: { ".dust": function() {} } }) });
    ctx.templateName = name;
    dust.render(name, ctx, cb);
}

function newDust() {
    var dust = freshy('dustjs-linkedin');

    dust.debugLevel = 'WARN';

    dust.onLoad = function(name, options, cb) {
        fs.readFile(path.resolve(__dirname, 'fixtures/templates', name + '.dust'), 'utf-8', cb);
    };

    return dust;
}

test('Make sure optional bundle content can be enabled', function (t) {
    var dust = newDust();

    makarahelpers.registerWith(dust, {
        autoloadTemplateContent: true,
        requireTemplateContent: false
    });

    render(dust, 'without-content', { locale: { country: 'US', language: 'en' } }, function (err, out) {
        t.error(err);
        t.equal(out, 'Hello');
        t.end();
    });
});
