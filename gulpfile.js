// command line options
var minimist = require('minimist');
module.exports = minimist(process.argv.slice(2), {
    boolean: [
        'p', // production build?
    ],
    default: {
        p: false,
    }
});

// require all tasks
var requireDir = require('require-dir');
requireDir('./gulp/tasks', {recurse: true});
