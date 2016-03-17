const gulp = require('gulp');
const gutil = require('gulp-util');

gulp.task('copy_html', function() {
    return gulp.src('./src/viz/index.html')
    .pipe(gulp.dest('./gh-pages/'))
    .on('error', gutil.log)
    ;
});
