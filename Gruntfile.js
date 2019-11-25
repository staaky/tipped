module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    dirs: {
      dest: "dist"
    },

    vars: {},

    concat: {
      options: { process: true },
      dist: {
        src: [
          "src/js/umd-head.js",
          "src/js/setup.js",
          "src/js/skins.js",

          // helpers
          "src/js/helpers/browser.js",
          "src/js/helpers/support.js",
          "src/js/helpers/helpers.js",
          "src/js/helpers/position.js",
          "src/js/helpers/bounds.js",
          "src/js/helpers/mouse.js",
          "src/js/helpers/color.js",
          "src/js/helpers/spin.js",
          "src/js/helpers/visible.js",
          "src/js/helpers/ajaxcache.js",
          "src/js/voila/voila.custom.js",

          // core
          "src/js/behaviors.js",
          "src/js/options.js",
          "src/js/skin.js",
          "src/js/stem.js",
          "src/js/tooltips.js",

          // tooltip
          "src/js/tooltip.js",
          "src/js/tooltip/display.js",
          "src/js/tooltip/update.js",
          "src/js/tooltip/layout.js",
          // tooltip (helpers)
          "src/js/tooltip/active.js",
          "src/js/tooltip/bind.js",
          "src/js/tooltip/disable.js",
          "src/js/tooltip/is.js",
          "src/js/tooltip/timers.js",

          "src/js/api.js",
          "src/js/delegate.js",
          "src/js/collection.js",

          "src/js/umd-tail.js"
        ],
        dest: "<%= dirs.dest %>/js/tipped.js"
      }
    },

    copy: {
      dist: {
        files: [
          {
            expand: true,
            cwd: "src/css/",
            src: ["**"],
            dest: "<%= dirs.dest %>/css/"
          }
        ]
      }
    },

    uglify: {
      dist: {
        options: {
          output: {
            comments: "some"
          }
        },
        src: ["<%= dirs.dest %>/js/tipped.js"],
        dest: "<%= dirs.dest %>/js/tipped.min.js"
      }
    },

    clean: {
      dist: "dist/"
    },

    watch: {
      scripts: {
        files: ["src/**/*.js", "src/**/*.css"],
        tasks: ["default"],
        options: {
          spawn: false
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("default", [
    "clean:dist",
    "concat:dist",
    "copy:dist",
    "uglify:dist"
  ]);
};
