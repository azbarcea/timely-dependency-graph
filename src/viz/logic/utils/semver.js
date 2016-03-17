var semver = require('semver')

function parseVersion(input) {
    var obj

    if (semver.valid(input)) {
        // '1.2.3' -> {isRelease: true, version: '1.2.3'}
        obj = {isRelease: true, version: input}
    } else {
        var range = semver.validRange(input)
        if (range) {
            // '~1.2.3' := '>=1.2.3 <1.3.0' -> {isRange: true, start: '1.2.3', stop: '1.3.0'}
            range = range.split(' ')
            obj = {isRange: true, first: range[0].slice(2), stop: range[1].slice(1)}
        } else {
            throw 'parseVersion input: ' + JSON.stringify(input)
        }
    }
    return obj
}

module.exports = {
    parseVersion: parseVersion,
};
