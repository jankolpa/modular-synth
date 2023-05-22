const { src, dest, watch, series } = require('gulp')
const gulp = require('gulp')
const sass = require('gulp-sass')(require('sass'))
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')
const terser = require('gulp-terser')
const browsersync = require('browser-sync').create()
const clean = require('gulp-clean')
const gutil = require('gutil')
const ftp = require('vinyl-ftp')
const argv = require('yargs').argv

// Sass Task
function scssTask () {
  return src('app/scss/style.scss', { sourcemaps: false })
    .pipe(sass())
    .pipe(postcss([cssnano()]))
    .pipe(dest('dist', { sourcemaps: '.' }))
}

// JavaScript Task
function jsTask () {
  return src('app/js/**/*.js', { sourcemaps: false })
    .pipe(terser())
    .pipe(dest('dist', { sourcemaps: '.' }))
}

// Browsersync Tasks
function browsersyncServe (cb) {
  browsersync.init({
    server: {
      baseDir: '.'
    }
  })
  cb()
}

function browsersyncReload (cb) {
  browsersync.reload()
  cb()
}

// Watch Task
function watchTask () {
  watch(['*.html', 'app/html/**/*.html', 'app/*.json'], browsersyncReload)
  watch(['app/scss/**/*.scss', 'app/js/**/*.js'], series(scssTask, jsTask, browsersyncReload))
}

function cleanFiles (cb) {
  gulp.src('dist', { read: false, allowEmpty: true })
    .pipe(clean())
  gulp.src('deploy', { read: false, allowEmpty: true })
    .pipe(clean())
  cb()
}

function copy (cb) {
  src('index.html', { sourcemaps: false })
    .pipe(dest('deploy', { sourcemaps: '.' }))
  src(['dist/**/*']).pipe(gulp.dest('deploy/dist'))
  src(['libs/**/*']).pipe(gulp.dest('deploy/libs'))
  src(['assets/**/*']).pipe(gulp.dest('deploy/assets'))

  src(['app/**/*']).pipe(gulp.dest('deploy/app'))
  cb()
}

const remoteLocation = '/jan-kolpakov'

function getFtpConnection () {
  const password = argv.pw
  return ftp.create({
    host: 'hosting110907.a2f48.netcup.net',
    port: 21,
    user: 'hosting110907',
    password,
    log: gutil.log
  })
}

// npm run deploy -- --pw=<PASSWORD>
function uploadDeploy (cb) {
  const conn = getFtpConnection()

  // Lade den alten Remote-Ordner vor dem Hochladen des neuen Ordners
  conn.rmdir(remoteLocation + '/*', function (err) {
    if (err) {
      console.error('Fehler beim Löschen des alten Remote-Ordners:', err)
    } else {
      console.log('Alter Remote-Ordner erfolgreich gelöscht.')

      // Starte den Hochladevorgang des neuen Ordners
      gulp.src('./deploy/**/*', { base: './deploy', buffer: false })
        .pipe(conn.newer(remoteLocation))
        .pipe(conn.dest(remoteLocation))
    }
    cb()
  })
}

// Default Gulp task
exports.default = series(
  scssTask,
  jsTask,
  browsersyncServe,
  watchTask
)

exports.clean = cleanFiles

exports.deploy = series(
  scssTask,
  jsTask,
  copy
)

exports.upload = series(
  uploadDeploy
)
