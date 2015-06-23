var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var fs = require('fs');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var argv = require('minimist')(process.argv.slice(2));
var pkg = require('./package.json');
var banner = [
  '/*!',
  ' * <%= pkg.config.namePretty %> v<%= pkg.version %> (<%= pkg.homepage %>)',
  ' * <%= pkg.description %>',
  ' * Copyright <%= pkg.config.startYear %><% if (new Date().getFullYear() > pkg.config.startYear) { %>-<%= new Date().getFullYear() %><% } %> <%= pkg.author %>',
  ' * license <%= pkg.license %>',
  ' */',
  ''
].join('\n');


gulp.task('bump-version', function () {
  if (argv.v) {
    console.log('Bumping a ' + argv.v + ' version.');
  } else {
    console.log('Missing bump type. Use command gulp release -v patch|minor|major');
  }
  return gulp.src(['./bower.json', './package.json'])
    .pipe($.bump({type: argv.v}).on('error', $.util.log))
    .pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
  return gulp.src('.')
    .pipe($.git.commit('[Prerelease] Bumped version number', {args: '-a'}));
});

gulp.task('push-changes', function (cb) {
  $.git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
  var version = getPackageJsonVersion();
  $.git.tag(version, 'Created Tag for version: ' + version, function (error) {
    if (error) {
      return cb(error);
    }
    $.git.push('origin', 'master', {args: '--tags'}, cb);
  });

  function getPackageJsonVersion () {
    //We parse the json file instead of using require because require caches multiple calls so the version number won't be updated
    return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
  };
});

gulp.task('release', function (callback) {
  runSequence(
    'bump-version',
    'commit-changes',
    'push-changes',
    'create-new-tag',
    function (error) {
      if (error) {
        console.log(error.message);
      } else {
        console.log('RELEASE FINISHED SUCCESSFULLY');
      }
      callback(error);
    });
});

gulp.task('deploy', function() {
  return gulp.src([
    './index.html',
    './dist/**/*.js',
    './dist/**/*.css'
  ], { base: './' })
    .pipe($.ghPages());
});

gulp.task('scripts', function () {
  return gulp.src('src/**/*.js')
    // .pipe($.stripDebug()) // @todo, it breaks closure compiler...
    .pipe($.header(banner, { pkg: pkg }))
    .pipe($.rename(pkg.name + '.js'))
    .pipe(gulp.dest('./dist'))
    // .pipe($.uglify({ preserveComments: 'some', compress: { drop_console: true } }))
    .pipe($.if(argv.dist, $.closureCompiler({
      compilerPath: 'bower_components/closure-compiler/lib/vendor/compiler.jar',
      fileName: 'build.js',
      compilerFlags: {
        compilation_level: 'ADVANCED_OPTIMIZATIONS',
        warning_level: 'VERBOSE'
      }
    })))
    .pipe($.if(argv.dist, $.header(banner, { pkg: pkg })))
    .pipe($.if(argv.dist, $.rename(pkg.name + '.min.js')))
    .pipe($.if(argv.dist, gulp.dest('./dist')))
    .pipe(reload({stream: true}));
});

gulp.task('styles', function () {
  return gulp.src('src/**/*.scss')
    .pipe($.if(argv.dist, $.header(banner, { pkg: pkg })))
    .pipe($.if(argv.dist, $.rename('_' + pkg.name + '.scss')))
    .pipe($.if(argv.dist, gulp.dest('./dist')))
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      require('autoprefixer-core')({browsers: ['last 2 versions', 'ie 8']})
    ]))
    .pipe($.combineMediaQueries()) // { log: true }
    .pipe($.sourcemaps.write())
    .pipe($.header(banner, { pkg: pkg }))
    .pipe($.rename(pkg.name + '.css'))
    .pipe(gulp.dest('./dist'))
    .pipe($.if(argv.dist, $.minifyCss({ compatibility: 'ie8,+units.rem' })))
    // .pipe($.if(argv.dist, $.header(banner, { pkg: pkg })))
    .pipe($.if(argv.dist, $.rename(pkg.name + '.min.css')))
    .pipe($.if(argv.dist, gulp.dest('./dist')))
    .pipe(reload({stream: true}));
});

function jshint(files) {
  return function () {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.jshint())
      .pipe($.jshint.reporter('jshint-stylish'))
      .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
  };
}

gulp.task('jshint', jshint('src/**/*.js'));
gulp.task('jshint:test', jshint('test/spec/**/*.js'));

gulp.task('serve', ['scripts', 'styles'], function () {
  browserSync({
    notify: false,
    port: 9000,
    open: (!!argv.o || !!argv.open) || false,
    server: {
      baseDir: ['.tmp', './'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  // watch for changes
  gulp.watch([
    'index.html',
    'src/**/*.js'
  ]).on('change', reload);
  gulp.watch('src/**/*.js', ['scripts']);
  gulp.watch('src/**/*.scss', ['styles']);
  gulp.watch('demo/**/*.jade', ['demo-tpl']);
  // gulp.watch('bower.json', ['wiredep']);
});

gulp.task('default', ['serve']);

gulp.task('demo-tpl', function () {
  return gulp.src(['demo/index.jade'])
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('./'));
});