const
    path = require('path'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    less = require('gulp-less'),
    browserSync = require('browser-sync');

gulp.task('style', function() {
    return gulp.src('./src/viz/style/index.less')
        .pipe(less({paths: ['./src/viz/style']})
        .on('error', gutil.log))
        .pipe(gulp.dest('./gh-pages'))
        .pipe(browserSync.stream())
        ;
});
