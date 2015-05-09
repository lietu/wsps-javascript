var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var mocha = require('gulp-mocha');

// Files to concatenate for build
var scripts = [
    'src/amd.header',
    'src/*.js',
    'src/amd.footer'
];

// Files to watch for changes
var watch = scripts.slice(0, scripts.length).concat([
    'tests/*.js'
]);

// Lint
gulp.task('lint', function () {
    return gulp.src('src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate and minify
gulp.task('build', function () {
    return gulp.src(scripts)
        .pipe(concat('wsps.js'))
        .pipe(gulp.dest('dist'))
        .pipe(rename('wsps.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

// Run tests
gulp.task('test', function () {
    return gulp.src('./tests/*.js')
        .pipe(mocha({reporter: 'spec'}));
});

// Watch for changes
gulp.task('watch', function () {
    // TODO: Tests should be run after build, doesn't do it atm.
    gulp.watch(watch, ['lint', 'build', 'test']);
});

// Default task is to do everything, and watch for changes
gulp.task('default', ['lint', 'build', 'test', 'watch']);
