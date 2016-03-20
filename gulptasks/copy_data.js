const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('copy_data', function() {
    return gulp.src('./data/**/*', {base: './'})
    .pipe(gulp.dest('./build/dev'))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
    ;
});
