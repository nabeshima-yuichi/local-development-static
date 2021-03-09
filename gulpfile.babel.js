import { src, dest, watch, parallel, series, lastRun } from 'gulp'
import webpackStream from 'webpack-stream'
import webpack from 'webpack'
import webpackConfigDev from './webpack.dev'
import webpackConfigProd from './webpack.prod'
import gulpLoadPlugins from 'gulp-load-plugins'
import browserSync from 'browser-sync'

const plugins = gulpLoadPlugins({
  DEBUG: false,
  pattern: ['gulp-*', '*', '@*/gulp{-,.}*', 'del', 'imagemin-mozjpeg', 'imagemin-pngquant'],
  replaceString: /^gulp(-|\.)/,
  rename: {
    'gulp-stylelint': 'gulpStylelint', // stylelintとコンフリクトするのでrename
    'imagemin-mozjpeg': 'mozjpeg',
    'imagemin-pngquant': 'pngquant',
  }
})

const paths = {
  ejs: {
    src: ['./src/ejs/**/*.ejs', '!./src/ejs/**/_*.ejs'],
    dest: './dist',
  },
  css: {
    src: './src/scss/**/*.{css,scss,sass}',
    dest: './dist/assets/scss',
  },
  styleguide: './src/aigis/aigis_config.yml',
  js: {
    src: './src/js/**/*.js',
    dest: './dist/assets/js',
  },
  image: {
    src: './src/images/**/*.{jpg,jpeg,png,svg,gif}',
    dest: './dist/assets/images',
  },
  svg: {
    src: './src/sprites/icons/*.svg',
    dest: './src/sprites',
  },
}

const imageOptions = [
  plugins.pngquant({ quality: [0.7, 0.85] }),
  plugins.mozjpeg({ quality: 85 }),
  plugins.imagemin.gifsicle(),
  plugins.imagemin.jpegtran(),
  plugins.imagemin.optipng(),
  plugins.imagemin.svgo({ removeViewBox: false, }),
]

// Sass
export const sass = () => {
  const mode = process.env.NODE_ENV === 'development' ? true : false // eslint-disable-line
  return src(paths.css.src, { sourcemaps: mode }) // devのみ.mapを出力する
    .pipe(plugins.plumber({
      errorHandler: function (err) {
        console.log(err.messageFormatted) // eslint-disable-line
        this.emit('end')
      }
    }))
    .pipe(plugins.sassGlob())
    .pipe(plugins.sass({ outputStyle: 'expanded' }))
    .pipe(plugins.autoprefixer())
    .pipe(dest(paths.css.dest, { sourcemaps: '.' }))
}

// Stylelint
export const stylelint = () => {
  return src(paths.css.src)
    .pipe(plugins.gulpStylelint({
      failAfterError: false,
      reporters: [
        { formatter: 'string', console: true }
      ],
      syntax: 'scss',
    }))
}

// Styleguide
export const styleguide = () => {
  return src(paths.styleguide)
    .pipe(plugins.aigis())
}

// EJS
export const ejs = () => {
  return src(paths.ejs.src)
    .pipe(plugins.plumber({
      errorHandler: function (err) {
        console.log(err.message) // eslint-disable-line
        this.emit('end')
      }
    }))
    .pipe(plugins.ejs())
    .pipe(plugins.rename({ extname: '.html' }))
    .pipe(dest(paths.ejs.dest))
}

// JS
export const js = () => {
  const mode = process.env.NODE_ENV === 'development' ? webpackConfigDev : webpackConfigProd // eslint-disable-line
  return src(paths.js.src)
    .pipe(webpackStream(mode, webpack)).on('error', function handleError() {
      this.emit('end')
    })
    .pipe(dest(paths.js.dest))
}

// php
export const php = () => {
  return src("./src/ejs/**/*.php")
    .pipe(dest("./dist"))
}

// yml
export const yml = () => {
  return src("./src/ejs/**/*.yml")
    .pipe(dest("./dist"))
}

// txt
export const txt = () => {
  return src("./src/ejs/**/*.txt")
    .pipe(dest("./dist"))
}

// Image
export const image = () => {
  const mode = process.env.NODE_ENV === 'development' ? false : true // eslint-disable-line
  return src(paths.image.src, { since: lastRun(image) })
    .pipe(plugins.if(mode, plugins.imagemin(imageOptions))) // prodのみimageminする
    .pipe(dest(paths.image.dest))
}

// SVG sprite
export const svg = () => {
  return src(paths.svg.src)
    .pipe(plugins.svgmin())
    .pipe(plugins.svgstore({ inlineSvg: true }))
    .pipe(
      plugins.cheerio({
        run: function ($) {
          $('svg').attr('style', 'display: none')
        },
        parserOptions: { xmlMode: true },
      }),
    )
    .pipe(plugins.rename('sprites.svg'))
    .pipe(dest(paths.svg.dest))
}

export const server = (done) => {
  browserSync.init({
    server: {
      baseDir: './dist/',
    }
  });
  done();
}

// reload
export const reload = () => {
  browserSync.reload()
}
// stream
export const stream = () => {
  browserSync.stream()
}
// Clean
export const clean = () => {
  return plugins.del('./dist/**/*')
}

// Watch
export const watchFiles = callback => {
  watch(paths.css.src).on('change', series(sass, stream))
  watch(paths.css.src).on('change', series(stylelint, reload))
  watch(paths.css.src).on('change', series(styleguide, reload))
  watch(paths.js.src).on('change', series(js, reload))
  watch(paths.ejs.src[0]).on('change', series(ejs, reload)) // partialファイルもwatchする
  watch("./src/ejs/**/*.php").on('change', series(php, reload))
  watch("./src/ejs/**/*.yml").on('change', series(yml, reload))
  watch("./src/ejs/**/*.txt").on('change', series(txt, reload))
  watch(paths.image.src).on('change', series(image, reload))
  callback()
}

export const dev = series(clean, parallel(sass, stylelint, styleguide, ejs, js, php, yml, txt, image), server, watchFiles)
export const prod = series(clean, parallel(sass, ejs, js, image))

export default dev
