var gulp = require('gulp'),
	uglify = require('gulp-uglify-es').default,
    concat = require('gulp-concat');
    cssmin = require('gulp-cssmin'),
    plumber = require('gulp-plumber'),
    rename = require('gulp-rename');
    less = require('gulp-less');
    watch = require('gulp-watch');
 
 
gulp.task('jsBundle',done =>{
    gulp.src('assets/js/scripts/popup.js')
		.pipe(uglify().on('error', function(e){
            console.log(e);
         }))
		.pipe(concat('popup.min.js'))
		.pipe(gulp.dest('assets/js/min'))
    done();

    gulp.src('assets/js/scripts/options.js')
    .pipe(uglify().on('error', function(e){
        console.log(e);
     }))
    .pipe(concat('options.min.js'))
    .pipe(gulp.dest('assets/js/min'))
done();
});

gulp.task('cssBundle', done => {
    gulp.src('assets/styles/*.less')
        .pipe(plumber())
        .pipe(less())
        .pipe(gulp.dest('assets/styles/css'))
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('assets/styles/min'))
    done();
});

gulp.task('watch',function(){
    gulp.watch('assets/js/scripts/*.js', gulp.series('jsBundle'));
    gulp.watch('assets/styles/*.less', gulp.series('cssBundle'));
});

gulp.task('default', gulp.parallel('jsBundle', 'cssBundle', 'watch'));