"use strict";
var makarahelpers = require('../');
var spundle = require('spundle');
var test = require('tape');
var path = require('path');
var freshy = require('freshy').freshy;

test('apply default content', function (t) {
    var dust = freshy('dustjs-linkedin');

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

test('apply default content when layout present', function (t) {
    var dust = freshy('dustjs-linkedin');

    makarahelpers.registerWith(dust, {localeRoot: path.resolve(__dirname, 'fixtures')});

    dust.addLoadMiddleware(function (name, context, cb) {
        if (name == 'test') {
            cb(null, '{>"layout" /}{<body}{@message key="hello"/} {@useContent bundle="world.properties"}{@message key="world" /}{/useContent}{/body}');
        } else {
            cb(null, '{+body/}');
        }
    });

    dust.render('test', {locale: { country: 'US', language: 'en' } }, function (err, out) {
        t.error(err);
        t.equal(out, 'Hello, World');
        t.end();
    });
});

test('Make sure unrequested content is unavailable', function (t) {
    var dust = freshy('dustjs-linkedin');

    makarahelpers.registerWith(dust, {localeRoot: path.resolve(__dirname, 'fixtures')});

    dust.addLoadMiddleware(function (name, context, cb) {
        cb(null, '{@message key="hello"/} {@message key="world" /}');
    });

    dust.render('test', {locale: { country: 'US', language: 'en' } }, function (err, out) {
        t.error(err);
        t.equal(out, 'Hello, ☃world☃');
        t.end();
    });
});

test('Make sure autoloading content behavior can be disabled', function (t) {
    var dust = freshy('dustjs-linkedin');

    makarahelpers.registerWith(dust, {
        localeRoot: path.resolve(__dirname, 'fixtures'),
        autoloadTemplateContent: false
    });

    dust.addLoadMiddleware(function (name, context, cb) {
        cb(null, '{@message key="hello"/}');
    });

    dust.render('test', {locale: { country: 'US', language: 'en' } }, function (err, out) {
        t.error(err);
        t.equal(out, '☃hello☃');
        t.end();
    });
});
