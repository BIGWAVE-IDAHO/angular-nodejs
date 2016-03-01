exports.config = {
	allScriptsTimeout: 11000,

	specs: [
		'test/e2e/**/*.js'
	],

	capabilities: {
		'browserName': 'chrome'
	},

	chromeOnly: true,
	chromeDriver: './node_modules/protractor/selenium/chromedriver',

	baseUrl: 'http://localhost:9001/',
	seleniumAddress: 'http://localhost:4444/wd/hub',

	onPrepare: function() {
		// The require statement must be down here, since jasmine-reporters
		// needs jasmine to be in the global and protractor does not guarantee
		// this until inside the onPrepare function.
		require('jasmine-reporters');
		jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter('xmloutput/', true, true));
	},
  
	framework: 'jasmine',

	jasmineNodeOpts: {
		onComplete: null,
		defaultTimeoutInterval: 30000,
		isVerbose: true,
		showColors: true,
		includeStackTrace: false
	}
};