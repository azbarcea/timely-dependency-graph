import { default as gulp } from 'gulp'
import { default as browserSync } from 'browser-sync'

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './build/dev',
        },
        port: 8001,
        open: false,
        reloadOnRestart: true,
        notify: false,
        ghostMode: false
    });

    gulp.watch([
        './src/viz/style/**/*.less',
    ], ['style']);
    gulp.watch([
        './src/viz/logic/**/*.js',
    ], ['logic', browserSync.reload]);
    gulp.watch('./src/viz/index.html', ['html', browserSync.reload]);
    gulp.watch('./data/**/*.json', ['data', browserSync.reload]);

    // images
    gulp.watch('./doc/images/**/*', ['images', browserSync.reload]);
    gulp.watch('./assets/**/*', ['assets', browserSync.reload]);
});
