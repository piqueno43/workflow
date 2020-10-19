import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import ejs from 'gulp-ejs';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import del from 'del';
import webpack from 'webpack-stream';
import browserSync from 'browser-sync';
import rename from 'gulp-rename';
import git from 'gulp-git';

const paths = {
  env: {
    src: './dist'
  },
  styles: {
    src: 'src/styles/**/*.scss',
    dest: 'dist/assets/css/',
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'dist/assets/js/',
  },
  images: {
    src: 'src/images/**/*.{jpg,jpeg,png}',
    dest: 'dist/assets/images/',
  },
  fonts: {
    src: 'src/fonts/**/*.{eot,svg,ttf,woff,woff2}',
    dest: 'dist/assets/fonts/',
  },
};

export const clean = () => del(['dist']);

export function serve() {
  return browserSync.init({
    server: {
      baseDir: paths.env.src,
    },
    open: false,
  });
}

export function styles() {
  return gulp
    .src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

export function scripts() {
  return gulp
    .src(paths.scripts.src)
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

export function images() {
  return gulp
    .src(paths.images.src, { since: gulp.lastRun(images) })
    .pipe(imagemin({ optimizationLevel: 5 }))
    .pipe(gulp.dest(paths.images.dest))
    .pipe(browserSync.stream());
}

export function fonts() {
  return gulp
    .src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest))
    .pipe(browserSync.stream());
}

export function views() {
  return gulp
    .src('src/index.ejs')
    .pipe(ejs())
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
}

export function watch() {
  gulp.watch(paths.styles.src, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.images.src, images);
  gulp.watch('src/**/*.ejs', views);
  gulp.watch('dist/index.html').on('change', browserSync.reload);
}

// Run git add
export function gitAdd() {
  return gulp
    .src(paths.env.src)
    .pipe(git.add())
}

// Run git commit
export function gitCommit() {
  return gulp
    .src(paths.env.src)
    .pipe(git.commit(`Send to production ${new Date()}`))
}
// Run add remote
export function gitRemote() {
  return gulp
    .src(paths.env.src)
    .pipe(git.addRemote('develop', 'https://github.com/piqueno43/workflow.git', function(){
      if (err) throw err;
      }))
}

// Run add push
export function gitPush() {
  return gulp
    .src(paths.env.src)
    .pipe(git.push('develop', ['master'], function (err) {
      if (err) throw err;
    }))
}

const build = gulp.series(clean, gulp.parallel(styles, scripts, images, views));

const defaultTask = gulp.parallel(build, serve, watch);
const production = gulp.parallel(gitAdd, gitCommit, gitPush);

gulp.task('build', build);

gulp.task('default', defaultTask);

gulp.task('production', production);

export default defaultTask;
