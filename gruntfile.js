'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('ant.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: {
      files: ['publish']
    },
    jsbeautifier: {
        files:['src/ant.*'] 
    },
    uglify: {
      options: {
        //sourceMapRoot: '../',
	banner: '<%= banner %>',
        sourceMap:'publish/src/ant.min.js.map',
	sourceMapUrl:'ant.min.js.map'
      },
    publish: {
        src: 'src/ant.js',
        dest: 'publish/src/ant.min.js'
      },
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src:'src/ant.js' 
      }
    },
    copy:{
       publish:{
 	src: ['src/Scripts/*min*','src/ant.html'],
	dest: 'publish/',
        options: {
	      process: function (content, srcpath) {
		if(srcpath==='src/ant.html'){
			content=content.replace(/ant\.js/g,"ant.min.js");
			return content.replace(/jquery-2.1.1.js/g,"jquery-2.1.1.min.js");
		}

	      }
         }
       }
     },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src']
      }
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsbeautifier');
  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'uglify','jsbeautifier','copy']);

};
