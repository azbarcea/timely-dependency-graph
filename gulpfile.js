// read and export command line options

var minimist = require('minimist');
module.exports = minimist(process.argv.slice(2), {
    boolean: 'a', // add analytics
    default: {a: false}
});

// require all tasks

var requireDir = require('require-dir');
requireDir('./gulptasks', {recurse: true});
