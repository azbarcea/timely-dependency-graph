const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('copy_images', function() {
    return gulp.src(['./doc/images/usage_quick.gif'], {base: './doc/images/'})
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
    ;
});
