var semver = require('semver')

function parseVersion(input) {
    var obj

    if (semver.valid(input)) {
        // '1.2.3' -> {isRelease: true, version: '1.2.3'}
        obj = {isRelease: true, version: input}
    } else {
        var range = semver.validRange(input)
        if (range) {
            range = range.split(' ')
            if (range.length === 1) {
                // '>= 1.0.0' := '>= 1.0.0' -> {isRelease: true, version: '1.0.0'}
                obj = {isRelease: true, version: range[0].slice(2)}
            } else if (range.length === 2) {
                // '~1.2.3' := '>=1.2.3 <1.3.0' -> {isRange: true, start: '1.2.3', stop: '1.3.0'}
                obj = {isRange: true, first: range[0].slice(2), stop: range[1].slice(1)}
            }
        } else {
            throw 'parseVersion input: ' + JSON.stringify(input)
        }
    }
    return obj
}

module.exports = {
    parseVersion: parseVersion,
};
