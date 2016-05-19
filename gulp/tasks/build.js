import { default as gulp } from 'gulp'

gulp.task('build', ['images', 'assets', 'data', 'html', 'logic', 'style']);
