const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify  = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const preprocess = require('gulp-preprocess');

const cliOptions = require('../gulpfile');
var isProductionBuild = cliOptions.p;

gulp.task('logic', function() {
    return browserify('./src/viz/logic/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(preprocess({
        context: {PRODUCTION: isProductionBuild}
    }))
    .pipe(gulp.dest('./build/dev'))
    .pipe(gulpif(isProductionBuild, uglify({preserveComments: 'license'})))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
