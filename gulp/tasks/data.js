import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'

gulp.task('data', () => {
    return gulp.src('./data/**/*', {base: './'})
    .pipe(gulp.dest('./build/dev'))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
