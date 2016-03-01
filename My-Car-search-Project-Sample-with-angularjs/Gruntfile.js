// Generated on 2014-04-14 using generator-angular 0.8.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	// Mod rewrite to support html5
	var modRewrite = require('connect-modrewrite');

	var profile = grunt.option('profile') || 'local';
	var profileConfig = require('./config/' + profile + '.json');
	profileConfig.APP_CONFIG.timestamp = new Date();

	var host = profileConfig.host || "localhost";
	var proxyUtils = require('grunt-connect-proxy/lib/utils');

	// Define the configuration for all the tasks
	grunt.initConfig({
		//configuration profiles
		ngconstant: {
			// Options for all targets
			options: {
				space: '  ',
				wrap: '"use strict";\n//AUTO GENERATED\n\n{%= __ngModule %}',
				name: 'config'
			},
			// Environment targets
			development: {
				options: {
					dest: '<%= yeoman.app %>/script/config.js'
				},
				constants: profileConfig
			},
			production: {
				options: {
					dest: '<%= yeoman.app %>/script/config.js'
				},
				constants: profileConfig
			}
		},

		// Project settings
		yeoman: {
			// configurable paths
			app: require('./bower.json').appPath || 'app',
			dist: 'dist'
		},

		// Watches files for changes and runs tasks based on the changed files
		watch: {
			bower: {
				files: ['bower.json'],
				tasks: ['bowerInstall']
			},
			js: {
				files: ['<%= yeoman.app %>/script/{,*/}*.js'],
				tasks: ['newer:jshint:all'],
				options: {
					livereload: true
				}
			},
			jsTest: {
				files: ['test/spec/{,*/}*.js'],
				tasks: ['newer:jshint:test', 'karma']
			},
			compass: {
				files: ['<%= yeoman.app %>/style/**/*{.scss, sass, png}'],
				tasks: ['compass:server', 'autoprefixer']
			},
			styles: {
				files: ['<%= yeoman.app %>/style/{,*/}*.css'],
				tasks: ['copy:styles', 'autoprefixer']
			},
			gruntfile: {
				files: ['Gruntfile.js']
			},
			livereload: {
				options: {
					livereload: '<%= connect.options.livereload %>'
				},
				files: [
					'<%= yeoman.app %>/{,*/}*.html',
					'.tmp/style/{,*/}*.{css,map}',
					'<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
				]
			}
		},

		// The actual grunt server settings
		connect: {
			options: {
				port: 8090,
				// Change this to '0.0.0.0' to access the server from outside.
				hostname: host,
				livereload: 35729,

				middleware: function (connect, options) {
					// Setup the proxy
					var middlewares = [require('grunt-connect-proxy/lib/utils').proxyRequest];

					var directory = options.directory || options.base[options.base.length - 1];

					// middlewares.push(modRewrite(['^/mobile.de/dealer-search/(.*)$ http://www.mobile.de/$1 [P]']));
					middlewares.push(modRewrite(['^/mobile.de/car-search/(.*)$ http://services.mobile.de/$1 [P]']));
					// middlewares.push(modRewrite(['^/pkw.de/car-details/(.*)$ http://www.pkw.de/api/v1/cars/$1 [P]']));
					middlewares.push(modRewrite(['^/autoscout/car-search/(.*)$ http://api.autoscout24.com/AS24_WS_Search [P]']));
					// middlewares.push(modRewrite(['^/silverdat/login$ http://www.dat.de/FinanceLine/services/Authentication [P]']));
					middlewares.push(modRewrite(['^/silverdat/vin-search$ http://www.dat.de/FinanceLine/services/VehicleIdentification [P]']));
					middlewares.push(modRewrite(['^/silverdat/vin-search-evaluation$ http://www.dat.de/FinanceLine/services/Evaluation [P]']));
					middlewares.push(modRewrite(['^/silverdat/search-vehicle-data$ http://www.dat.de/FinanceLine/services/VehicleSelection [P]']));
					middlewares.push(modRewrite(['^/silverdat/possible-equipment$ http://www.dat.de/FinanceLine/services/ConversionFunctions [P]']));

					// enable Angular's HTML5 mode
					middlewares.push(modRewrite(['!\\.html|\\.js|\\.svg|\\.css|\\.png|\\.gif$ /index.html [L]']));
					
					// add alias to fix font-awesome relative path problem
					middlewares.push(modRewrite(['^/fonts/(fontawesome.*)$ /bower_components/font-awesome/fonts/$1 [L]']));

					if (!Array.isArray(options.base)) {
						options.base = [options.base];
					}
					options.base.forEach(function(base) {
						// Serve static files.
						middlewares.push(connect.static(base));
					});

					// Make directory browse-able.
					middlewares.push(connect.directory(directory));

					return middlewares;
				}					
			},
			livereload: {
				options: {
					open: true,
					base: [
						'.tmp',
						'<%= yeoman.app %>'
					],
				},
				proxies: [{
					context: "/silverdat/Authentication",
					host: "www.dat.de",
					port: 80,
					changeOrigin: true,
					https: false,
					xforward: false,
					rewrite: [
						proxyUtils.rewriteContext("^/silverdat/Authentication", "/FinanceLine/services/Authentication"),
						proxyUtils.rewriteCookiePath("/silverdat")
					]
				}, {
					context: "/mobile.de/dealer-search",
					host: "www.mobile.de",
					changeOrigin: true,
					rewrite: [
						proxyUtils.rewriteContext("^/mobile.de/dealer-search", "")
					]
				}, {
					context: "/mobile.de/lookup",
					host: "services.mobile.de",
					changeOrigin: true,
					rewrite: [
						proxyUtils.rewriteContext("^/mobile.de/lookup", "")
					]
				}, {
					context: "/pkw.de/",
					host: "www.pkw.de",
					changeOrigin: true,
					rewrite: [
						proxyUtils.rewriteContext("^/pkw.de", "/api/v1")
					]
				}, {
					context: "/autoscout/lookup",
					host: "api.autoscout24.com",
					changeOrigin: true,
					rewrite: [
						proxyUtils.rewriteContext("^/autoscout/lookup", "")
					]
				}]	
			},
			test: {
				options: {
					port: 9001,
					base: [
						'.tmp',
						'test',
						'<%= yeoman.app %>'
					]
				}
			},
			dist: {
				options: {
					base: '<%= yeoman.dist %>'
				},
			}
		},

		// Make sure code styles are up to par and there are no obvious mistakes
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			all: [
				'Gruntfile.js',
				'<%= yeoman.app %>/script/{,*/}*.js'
			],
			test: {
				options: {
					jshintrc: 'test/.jshintrc'
				},
				src: ['test/spec/{,*/}*.js']
			}
		},

		// Empties folders to start fresh
		clean: {
			dist: {
				files: [
					{
						dot: true,
						src: [
							'.tmp',
							'<%= yeoman.dist %>/*',
							'!<%= yeoman.dist %>/.git*'
						]
					}
				]
			},
			server: '.tmp'
		},

		// Compiles Sass to CSS and generates necessary files if requested
		compass: {
			options: {
				sassDir: "<%= yeoman.app %>/style",
				cssDir: ".tmp/style",
				generatedImagesDir: ".tmp/asset/image",
				imagesDir: "<%= yeoman.app %>/sass_image_source",
				javascriptsDir: "<%= yeoman.app %>/script",
				fontsDir: "<%= yeoman.app %>/asset/font",
				importPath: "<%= yeoman.app %>/bower_components",
				httpImagesPath: "/asset/image",
				httpGeneratedImagesPath: "/asset/image",
				httpFontsPath: "/asset/font",
				relativeAssets: false,
				assetCacheBuster: false,
				raw: "Sass::Script::Number.precision = 10\n"
			},
			dist: {
				options: {
					generatedImagesDir: "<%= yeoman.dist %>/asset/image"
				}
			},
			server: {
				options: {
					debugInfo: true
				}
			}
		},

		// Add vendor prefixed styles
		autoprefixer: {
			options: {
				browsers: ['last 2 version', 'ie 9']
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: '.tmp/style/',
						src: '{,*/}*.css',
						dest: '.tmp/style/'
					}
				]
			}
		},

		// Automatically inject Bower components into the app
		bowerInstall: {
			app: {
				src: ['<%= yeoman.app %>/index.html'],
				ignorePath: '<%= yeoman.app %>/'
			},
			
			dev: {
				src: ['<%= yeoman.app %>/index.html'],
				ignorePath: '<%= yeoman.app %>/',
				devDependencies: true
			}
		},


		// Renames files for browser caching purposes
		rev: {
			dist: {
				files: {
					src: [
						'<%= yeoman.dist %>/script/{,*/}*.js',
						'<%= yeoman.dist %>/style/{,*/}*.{css,map}',
						'<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
					]
				}
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them
		useminPrepare: {
			html: '<%= yeoman.app %>/index.html',
			options: {
				dest: '<%= yeoman.dist %>',
				flow: {
					html: {
						steps: {
							js: ['concat', 'uglifyjs'],
							css: ['cssmin']
						},
						post: {}
					}
				}
			}
		},

		// Performs rewrites based on rev and the useminPrepare configuration
		usemin: {
			html: ['<%= yeoman.dist %>/{,*/}*.html'],
			css: ['<%= yeoman.dist %>/style/{,*/}*.css'],
			options: {
				assetsDirs: ['<%= yeoman.dist %>']
			}
		},

		// The following *-min tasks produce minified files in the dist folder
		cssmin: {
			options: {
				root: '<%= yeoman.app %>'
			}
		},

		imagemin: {
			dist: {
				files: [
					{
						expand: true,
						cwd: '<%= yeoman.app %>/asset/image',
						src: '{,*/}*.{png,jpg,jpeg,gif}',
						dest: '<%= yeoman.dist %>/asset/image'
					}
				]
			}
		},

		svgmin: {
			dist: {
				files: [
					{
						expand: true,
						cwd: '<%= yeoman.app %>/asset/image',
						src: '{,*/}*.svg',
						dest: '<%= yeoman.dist %>/asset/image'
					}
				]
			}
		},

		htmlmin: {
			dist: {
				options: {
					collapseWhitespace: false,
					collapseBooleanAttributes: true,
					removeCommentsFromCDATA: true,
					removeOptionalTags: true
				},
				files: [
					{
						expand: true,
						cwd: '<%= yeoman.dist %>',
						src: ['*.html', 'view/{,*/}*.html'],
						dest: '<%= yeoman.dist %>'
					}
				]
			}
		},

		// ngmin tries to make the code safe for minification automatically by
		// using the Angular long form for dependency injection. It doesn't work on
		// things like resolve or inject so those have to be done manually.
		ngmin: {
			dist: {
				files: [
					{
						expand: true,
						cwd: '.tmp/concat/script',
						src: '*.js',
						dest: '.tmp/concat/script'
					}
				]
			}
		},

		// Replace Google CDN references
		cdnify: {
			dist: {
				html: ['<%= yeoman.dist %>/*.html']
			}
		},

		// Copies remaining files to places other tasks can use
		copy: {
			dist: {
				files: [
					{
						expand: true,
						dot: true,
						cwd: '<%= yeoman.app %>',
						dest: '<%= yeoman.dist %>',
						src: [
							'*.{ico,png,txt}',
							'.htaccess',
							'*.html',
							'view/{,*/}*.html',
							'image/{,*/}*.{webp}',
							'fonts/*'
						]
					},
					{
						expand: true,
						cwd: '<%= yeoman.app %>',
						dest: '<%= yeoman.dist %>',
						src: [
							'image/*'
						]
					},
					{
						expand: true,
						cwd: '.tmp/asset/image',
						dest: '<%= yeoman.dist %>/asset/image',
						src: ['generated/*']
					},
					// copy FontAwesome font, usemin cannot handle relative paths in css
					// https://github.com/yeoman/grunt-usemin/issues/184
					{
						expand: true,
						cwd: '<%= yeoman.app %>/bower_components/font-awesome/fonts',
						dest: '<%= yeoman.dist %>/bower_components/font-awesome/fonts',
						src: ['*']
					}
				]
			},
			styles: {
				expand: true,
				cwd: '<%= yeoman.app %>/style',
				dest: '.tmp/style/',
				src: '{,*/}*.css'
			}
		},

		// Run some tasks in parallel to speed up the build process
		concurrent: {
			server: [
				'compass:server'
			],
			test: [
				'compass'
			],
			dist: [
				'compass:dist',
				'copy:styles',
				'imagemin',
				'svgmin'
			]
		},

		// By default, your `index.html`'s <!-- Usemin block --> will take care of
		// minification. These next options are pre-configured if you do not wish
		// to use the Usemin blocks.
		// cssmin: {
		//	dist: {
		//	 files: {
		//		'<%= yeoman.dist %>/style/main.css': [
		//		 '.tmp/style/{,*/}*.css',
		//		 '<%= yeoman.app %>/style/{,*/}*.css'
		//		]
		//	 }
		//	}
		// },
		// uglify: {
		//	dist: {
		//	 files: {
		//		'<%= yeoman.dist %>/script/script.js': [
		//		 '<%= yeoman.dist %>/script/script.js'
		//		]
		//	 }
		//	}
		// },
		// concat: {
		//	dist: {}
		// },

		// Test settings
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true,
				reporters: 'junit'
			}
		},
		protractor_webdriver: {
		  app: {
				options: {
					 path: 'node_modules/protractor/bin/',
					 command: 'webdriver-manager start'
				}
		  }
		}, 
		protractor: {
			options: {
				configFile: "node_modules/protractor/referenceConf.js", // Default config file
				keepAlive: true, // If false, the grunt process stops when the test fails.
				noColor: false, // If true, protractor will not use colors in its output.
				args: {
					// Arguments passed to the command
				}
			},
			app: {
				options: {
					configFile: "protractor-conf.js", // Target-specific config file
					args: {} // Target-specific arguments
				}
			},
		},

		nggettext_extract: {
			pot: {
				files: {
					'i18n/main.pot': ['app/index.html','app/view/*.html']
				}
			}
		},
		nggettext_compile: {
			all: {
				options: {
					module: 'cardetectiveApp'
				},
				files: {
					'app/script/i18n/translations.js': ['i18n/*.po']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-connect-proxy');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-angular-gettext');
	grunt.loadNpmTasks('grunt-protractor-runner');
	grunt.loadNpmTasks('grunt-protractor-webdriver');
	grunt.loadNpmTasks('grunt-karma');
	
	grunt.registerTask('serve', function (target) {
		if (target === 'dist') {
			return grunt.task.run(['build', 'configureProxies:dist', 'connect:dist:keepalive']);
		}

		grunt.task.run([
			'clean:server',
			'ngconstant:development',
			'bowerInstall:' + (target || 'app'),
			'nggettext_extract',
			'nggettext_compile',
			'configureProxies:livereload',
			'concurrent:server',
			'autoprefixer',
			'connect:livereload',
			'watch'
		]);
	});

	grunt.registerTask('server', function (target) {
		grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
		grunt.task.run(['serve:' + target]);
	});

	grunt.registerTask('test', [
		'clean:server',
		'bowerInstall:dev',
		'concurrent:test',
		'autoprefixer',
		'connect:test',
		'karma',
		'protractor_webdriver',
		'protractor'
	]);

	grunt.registerTask('build', [
		'clean:dist',
		'ngconstant:production',
		'bowerInstall:app',
		'nggettext_extract',
		'nggettext_compile',
		'useminPrepare',
		'concurrent:dist',
		'autoprefixer',
		'concat',
		'ngmin',
		'copy:dist',
		'cdnify',
		'cssmin',
		'uglify',
		'rev',
		'usemin',
		'htmlmin'
	]);

	grunt.registerTask('default', [
		'newer:jshint',
		'test',
		'build'
	]);
};