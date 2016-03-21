const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('default', function() {
    runSequence(['copy_images', 'copy_data', 'copy_html', 'logic', 'style'], 'serve');
});
