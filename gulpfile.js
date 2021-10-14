const fs = require('fs')

const {
  series,
  parallel,
  src,
  dest,
  watch
} = require('gulp')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')

const entry = './src/'
const Output = './dist/'
const FileName = '**/*.js'

const clean = cb => {
  let isExist = true
  try {
    fs.accessSync(Output + FileName)
  } catch (error) {
    isExist = false
  }
  if (isExist) {
    fs.unlink(Output + FileName, cb)
  } else {
    cb()
  }
}

const transfer = _ => {
  return src(entry + FileName)
    .pipe(babel({
      presets: ['@babel/env'],
      plugins: ['@babel/transform-runtime']
    }))
    .pipe(dest(Output))
}

const build = _ => {
  return src(entry + FileName)
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(dest(Output))
}

const dev = cb => {
  watch(entry + FileName, { ignoreInitial: false }, series(clean, transfer))
  cb()
}


exports.dev = dev

exports.default = series(clean, build)
