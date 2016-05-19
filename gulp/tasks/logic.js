import { default as gulp } from 'gulp'
import { default as gutil } from 'gulp-util'
import { default as browserify } from 'browserify'
import { default as source } from 'vinyl-source-stream'
import { default as buffer } from 'vinyl-buffer'
import { default as uglify } from 'gulp-uglify'
import { default as gulpif } from 'gulp-if'
import { default as preprocess } from 'gulp-preprocess'
import { default as opts } from '../opts';

gulp.task('logic', () => {
    return browserify('./src/viz/logic/index.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe( preprocess({ context: {PRODUCTION: opts.p} }) )
    .pipe(gulp.dest('./build/dev'))
    .pipe(gulpif(opts.p, uglify({preserveComments: 'license'})))
    .pipe(gulp.dest('./build/dist'))
    .on('error', gutil.log)
});
