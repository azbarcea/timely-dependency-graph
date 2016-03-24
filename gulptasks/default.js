const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('default', function() { runSequence('build', 'serve') });
