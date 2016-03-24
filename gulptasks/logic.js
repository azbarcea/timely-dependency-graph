const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify  = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');
var preprocess = require('gulp-preprocess');
var cliOptions = require('../gulpfile');

gulp.task('logic', function() {
    return browserify('./src/viz/logic/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(preprocess({
        context: {PRODUCTION: cliOptions.p}
    }))
    .pipe(gulp.dest('./build/dev'))
    .pipe(uglify({preserveComments: 'license'}))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
