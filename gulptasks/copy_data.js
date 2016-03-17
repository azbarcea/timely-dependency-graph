const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('copy_data', function() {
    return gulp.src('./data/**/*', {base: './'})
    .pipe(gulp.dest('./gh-pages/'))
    .on('error', gutil.log)
    ;
});
