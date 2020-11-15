var gulp = require('gulp');
var minifycss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var htmlclean = require('gulp-htmlclean');
var imagemin = require('gulp-imagemin');
var babel=require('gulp-babel');


// 压缩html
gulp.task('minify-html', function() {
    return gulp.src('./public/**/**/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
        }))
        .pipe(gulp.dest('./public'))
});
// 压缩css
gulp.task('minify-css', function() {
    return gulp.src('./public/css/*.css')
        .pipe(minifycss({
            compatibility: 'ie8'
        }))
        .pipe(gulp.dest('./public/css'));
});
// 压缩js
gulp.task('minify-js', function() {
    return gulp.src('./public/js/*.js')
	    .pipe(babel({
			//将ES6代码转义为可执行的js代码
			presets: ['es2015']
		}))
        .pipe(uglify())
        .pipe(gulp.dest('./public/js'));
});
// 压缩图片
gulp.task('minify-images', function() {
    return gulp.src('./public/img/*.*')
        .pipe(imagemin(
        [imagemin.gifsicle({'interlaced': true}), 
        imagemin.mozjpeg({'progressive': true}), 
        imagemin.optipng({'optimizationLevel': 5}), 
        imagemin.svgo({
			plugins: [
				{removeViewBox: true},
				{cleanupIDs: false}
			]
		})]
        ))
        .pipe(gulp.dest('./public/img'))
});

// 执行 gulp 命令时执行的任务
gulp.task('default',gulp.series(
    'minify-html','minify-css','minify-js','minify-images',done => done()
));