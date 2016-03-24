const gulp = require('gulp');
const gutil = require('gulp-util');
var preprocess = require('gulp-preprocess');
var cliOptions = require('../gulpfile');

gulp.task('html', function() {
    return gulp.src('./src/viz/index.html')
        .pipe(preprocess({
            context: {PRODUCTION: cliOptions.p}
        }))
        .pipe(gulp.dest('./build/dev'))
        .pipe(gulp.dest('./build/dist'))
        .on('error', gutil.log);
});
