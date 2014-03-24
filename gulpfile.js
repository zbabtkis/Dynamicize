var gulp = require('gulp');

var uglify = require('gulp-uglify')
  , rename = require('gulp-rename');

gulp.task('scripts', function() {
	return gulp.src('src/dynamicize.js')
		.pipe(rename('dynamicize.min.js'))
		.pipe(gulp.dest('dist'))
		.pipe(uglify())
		.pipe(gulp.dest('dist'));
});
