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
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
};
