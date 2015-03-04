"use strict";
var dust = require('dustjs-linkedin');
var makarahelpers = require('../');
var spundle = require('spundle');
var test = require('tape');
var path = require('path');

test('apply default content', function (t) {
    makarahelpers.registerWith(dust, {localeRoot: path.resolve(__dirname, 'fixtures')});

    dust.addLoadMiddleware(function (name, context, cb) {
        cb(null, '{@message key="hello"/} {@useContent bundle="world.properties"}{@message key="world" /}{/useContent}');
    });

    dust.render('test', {locale: { country: 'US', language: 'en' } }, function (err, out) {
        t.error(err);
        t.equal(out, 'Hello, World');
        t.end();
    });
});
