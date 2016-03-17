const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify  = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('logic', function() {
    return browserify('./src/viz/logic/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./gh-pages'))
    .on('error', gutil.log)
});
