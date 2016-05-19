import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'

gulp.task('images', () => {
    return gulp.src([
        './doc/images/usage_quick.gif',
        './doc/images/d3_modules_d3_axis_sets.png'
    ], {base: './doc/images/'})
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
