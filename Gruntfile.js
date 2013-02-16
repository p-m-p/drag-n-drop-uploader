module.exports = function (grunt) {
  grunt.initConfig({
      jshint: {
        options: {
            laxcomma: true
          , lastsemic: true
          , browser: true
          , supernew: true
          , globals: {_: true}
        },
        all: ['Gruntfile.js', 'js/uploader.js']
      }
    , jasmine: {
        all: {
            src: 'js/uploader.js'
          , options: {
                vendor: 'js/vendor/lodash.min.js'
              , specs: 'spec/*-spec.js'
              , template: 'spec/runner.tmpl'
            }
        }
      }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.registerTask('test', ['jshint', 'jasmine']);
};
