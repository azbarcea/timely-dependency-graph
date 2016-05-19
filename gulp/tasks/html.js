import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'
import { default as preprocess } from 'gulp-preprocess'
import { default as opts } from '../opts';

gulp.task('html', () => {
    return gulp.src('./src/viz/index.html')
        .pipe( preprocess({ context: {PRODUCTION: opts.p} }) )
        .pipe(gulp.dest('./build/dev'))
        .pipe(gulp.dest('./build/dist'))
        .on('error', gutil.log);
});
