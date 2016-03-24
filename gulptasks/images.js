const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('images', function() {
    return gulp.src([
        './doc/images/usage_quick.gif',
        './doc/images/d3_modules_d3_axis_sets.png'
    ], {base: './doc/images/'})
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
    ;
});
