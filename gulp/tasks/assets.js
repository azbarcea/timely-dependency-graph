const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('assets', function() {
    return gulp.src('./assets/**/*', {base: './assets/'})
    .pipe(gulp.dest('./build/dev/assets/'))
    .pipe(gulp.dest('./build/dist/assets/'))
    .on('error', gutil.log)
    ;
});
