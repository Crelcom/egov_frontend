var gulp = require('gulp');
var sass  = require('gulp-sass');
var prefix = require('gulp-autoprefixer');

var paths = {
    styles: {
        src: './public/stylesheets/scss/styles.scss',
        dest: './public/stylesheets/css'
    }
};

gulp.task('sass', function(){
    gulp.src(paths.styles.src)
        .pipe(sass({errLogToConsole: true}))
        .pipe(prefix(
            'last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'
        ))
        .pipe(gulp.dest(paths.styles.dest));
});

gulp.task('default', ['sass'], function(){
    gulp.watch(paths.styles.src, ['sass'])
        .on('change', function(e){
            console.log('[watcher] File ' + e.path + ' was ' + e.type + ', compiling...');
        });
});