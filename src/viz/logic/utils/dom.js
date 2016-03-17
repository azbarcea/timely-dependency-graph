var _ = require('underscore');

function getElementGeometry(elem) {
    var cs = getComputedStyle(elem);
    var size = _.chain(cs)
        .pick('width', 'height')
        .mapObject(function(pxValue) { return parseFloat(pxValue, 10); })
        .value()
        ;
    return size;
}

function getTextFontSize(textElem) {
    var fontSizePx = getComputedStyle(textElem).fontSize;
    return parseFloat(fontSizePx, 10);
}

module.exports = {
    getElementGeometry: getElementGeometry,
    getTextFontSize: getTextFontSize
};
