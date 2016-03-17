// `node grab.js` to download in data/

var fs = require('fs');
var path = require('path');

var d3 = require('d3');
var _ = require('underscore');
var request = require('request');

var NPM_API_BASE = 'http://registry.npmjs.cf/'
var MAIN_MODULE = 'd3'
var dataDir = path.resolve(path.join(__dirname, '../../data'))

var progress = {};
var data = {};

var dispatch =
    d3.dispatch(
        'register_module',
        'mark_module',
        'check_modules',

        'fetch_module',
        'module_fetched'
    )
    .on('register_module', registerModule)
    .on('mark_module', markModule)
    .on('check_modules', checkModules)
    .on('fetch_module', fetchModule)
    .on('module_fetched.store', storeModule)
    .on('module_fetched.process', processModule)

dispatch.fetch_module(MAIN_MODULE);

function registerModule(name) {
    progress[name] = true;
}

function markModule(name) {
    progress[name] = false;
    dispatch.check_modules();
}

function checkModules() {
    var allDone = _.chain(progress).values().filter().isEmpty().value() === true;
    if (allDone) {
        console.log('Done.');
    }
}

function fetchModule(name) {
    dispatch.register_module(name);
    request(NPM_API_BASE + name, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            dispatch.module_fetched(name, JSON.parse(body));
        }
    })
}

function processModule(name, module) {

    /* fetch missing deps */
    _.chain(module.versions)
        .pick(function(release, version) {
            return name === 'd3' ? version[0] >= '4' : true
        })
        .map(function(release, version) {
            return _.keys(release.dependencies)
        })
        .flatten()
        .uniq()
        .each(function(depName) {
            if (!_.has(progress, depName)) {
                dispatch.fetch_module(depName);
            }
        })

    /* mark module as done */
    dispatch.mark_module(name);
}

function storeModule(name, module) {
    var filepath = path.resolve(path.join(dataDir, name + '.json'))
    var moduleString = JSON.stringify(module, null, 2)
    fs.writeFile(filepath, moduleString, function(err) {
        if (err) {throw err}
        console.log('stored', filepath);
    })
}
