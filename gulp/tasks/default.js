import { default as gulp } from 'gulp'
import { default as runSequence } from 'run-sequence'

gulp.task('default', () => { runSequence('build', 'serve') })
