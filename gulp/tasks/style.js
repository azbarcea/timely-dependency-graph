import { default as path } from 'path'
import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'
import { default as less } from 'gulp-less'
import { default as cssnano } from 'gulp-cssnano'
import { default as browserSync } from 'browser-sync'

var cssnanoOptions = {

    /* custom */

    safe: true,
    calc: false,
    normalizeUrl: {normalizeProtocol: false},
    autoprefixer: {browsers: 'last 3 versions'},

    /* defaults, explicit to understand what's going on */

    discardComments: true,
    discardEmpty: true,
    discardDuplicates: true,
    normalizeCharset: true,
    minifySelectors: true,
    uniqueSelectors: true,
    mergeLonghand: true,
    minifyFontValues: true,

    // careful, converts px to picas, check this in case of problems
    convertValues: true,
    reduceTransforms: true,
    colormin: true,
    mergeRules: true,
    minifyGradients: true,


    /* unsafe */

    // custom
    zindex: false,
    mergeIdents: false,

    // defaults
    discardUnused: true,
    reduceIdents: true,
};

gulp.task('style', () => {
    return gulp.src('./src/viz/style/index.less')
        .pipe(less({paths: ['./src/viz/style']}).on('error', gutil.log))
        .pipe(gulp.dest('./build/dev'))
        .pipe(cssnano(cssnanoOptions))
        .pipe(gulp.dest('./build/dist'))
        .pipe(browserSync.stream())
        ;
});
