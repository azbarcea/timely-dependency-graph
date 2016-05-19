import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'

gulp.task('assets', () => {
    return gulp.src('./assets/**/*', {base: './assets/'})
    .pipe(gulp.dest('./build/dev/assets/'))
    .pipe(gulp.dest('./build/dist/assets/'))
    .on('error', gutil.log)
});
