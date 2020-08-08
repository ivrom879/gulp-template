const projectFolder = 'dist';
const sourceFolder = 'src';
const { src, dest } = require('gulp');
const gulp = require('gulp');
const browsersync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const del = require('del');
const scss = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const grpoupMedia = require('gulp-group-css-media-queries');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');
const fs = require('fs');

const path = {
    build: {
        html: projectFolder + '/',
        css: projectFolder + '/css/',
        js: projectFolder + '/js/',
        img: projectFolder + '/img/',
        fonts: projectFolder + '/fonts/',
    },
    src: {
        html: [sourceFolder + '/*.html', "!" + sourceFolder + '/_*.html'],
        css: sourceFolder + '/scss/style.scss',
        js: sourceFolder + '/js/index.js',
        img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
        fonts: sourceFolder + '/fonts/*.ttf',
    },
    watch: {
        html: sourceFolder + '/**/*.html',
        css: sourceFolder + '/scss/**/*.scss',
        js: sourceFolder + '/js/**/*.js',
        img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    },
    clean: './' + projectFolder + '/'
};

function browserSync() {
    browsersync.init({
        server: {
            baseDir: './' + projectFolder + '/'
        },
        port: 5050,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            grpoupMedia()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ['last 5 versions'],
                cascade: true
            })
        )
        .pipe(dest(path.build.css))
        .pipe(cleanCss())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function () {
    return src([sourceFolder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(sourceFolder + '/fonts/'));
});

gulp.task('svgSprite', function () {
    return gulp.src([sourceFolder + '/img/icons/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg',
                    // example: true
                }
            }
        }))
        .pipe(dest(path.build.img));
});

function fontsStyle() {
    let file_content = fs.readFileSync(sourceFolder + '/scss/fonts.scss'); 
    if (file_content == '') { 
        fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb); 
        return fs.readdir(path.build.fonts, function (err, items) { 
            if (items) { 
                let c_fontname; 
                for (var i = 0; i < items.length; i++) { 
                    let fontname = items[i].split('.'); 
                    fontname = fontname[0]; 
                    if (c_fontname != fontname) { 
                        fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    } 
                    c_fontname = fontname; 
                } 
            } 
        }) 
    }
}

function cb() {}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
    return del(path.clean);
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), fontsStyle);
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;