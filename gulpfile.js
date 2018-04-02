const gulp   = require('gulp');
const eslint = require('gulp-eslint');

const inputPaths = {
  javascript: [
    'gulpfile.js',
    'src/*.js',
    'index.js',
  ],
};

/**
 * JS es6
 */

gulp.task('js:lint', function () {
  // http://eslint.org/docs/rules
  let task = gulp
    .src(inputPaths.javascript)
    .pipe(eslint())
    .pipe(eslint.format());

  if (process.env.CI) {
    task = task.pipe(eslint.failAfterError());
  }

  return task;
});

gulp.task('js:watch', () => {
  gulp.watch(inputPaths.javascript, ['js:lint']);
});

/**
 * Main tasks
 */

gulp.task('watch', ['js:watch']);
gulp.task('lint', ['js:lint']);
gulp.task('build', ['lint']);
gulp.task('default', ['build', 'watch']);
