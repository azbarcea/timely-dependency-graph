const
    gulp = require('gulp'),
    browserSync = require('browser-sync');

gulp.task('serve', function() {
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
    gulp.watch('./src/viz/index.html', ['copy_html', browserSync.reload]);
    gulp.watch('./data/**/*.json', ['copy_data', browserSync.reload]);
});
