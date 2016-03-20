const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify  = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const uglify = require('gulp-uglify');

gulp.task('logic', function() {
    return browserify('./src/viz/logic/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build/dev'))
    .pipe(uglify({preserveComments: 'license'}))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
