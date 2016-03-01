'use strict';

angular.module('cardetectiveApp', [
	'ui.router',
	'gettext',
	'ngError',
	'config',
	'months',
	'urlParametersMap',
	'savedSearchParametersMap',
	'serviceProvidersIds',
	'mobileApiRequestParameters',
	'DuplicatePropertiesMap',
	'errorMessages',
	'ResultColumns',
	'ui.tree',
	'ui.select',
	'ngSanitize',
	'ui.bootstrap',
	'ngDialog',
	'vatableOptions',
	'fuelGrouping',
	'vcRecaptcha'
])
.config(function($httpProvider) {
	$httpProvider.defaults.withCredentials = true;
	$httpProvider.defaults.transformRequest.unshift(function (data, headersGetter) {
		if (headersGetter()["Content-Type"] === "application/x-www-form-urlencoded") {
			return $.param(data);
		}
		
		return data;
	});
})
.config(function($stateProvider, $locationProvider, $urlRouterProvider, CAR_SEARCH_URL_PARAMETERS_MAP) {
	// TODO: Tidy up the initial state logic
	
	$locationProvider.html5Mode(true);
	
	$urlRouterProvider
		.when("/", ["$state", "authenticationManager", function($state, authenticationManager) {
			var homeState = authenticationManager.getHomeState();

			$state.go(homeState.name, homeState.params);
		}])
		.otherwise(function($injector) {
			var $state = $injector.get("$state");
			
			$state.go("non-existing-section");
		});
	
	var isAuthenticated = ["authenticationManager", function(authenticationManager) {
		return authenticationManager.isAuthenticated();
	}];

	var isAuthenticatedAdmin = ["profileManager", function(profileManager) {
		return (profileManager.getRoles().indexOf("ADMIN")) >= 0;
	}];

	var isNotAuthenticated = ["authenticationManager", function(authenticationManager) {
		return !authenticationManager.isAuthenticated();
	}];

	var notAuthenticatedResolveObject = {
		isAuthenticated: function(authenticationManager, $state) {
			var authenticationPromise = authenticationManager.reloadAuthenticatedUserIfNeeded(true);

			authenticationPromise.then(function() {
				if (authenticationManager.isAuthenticated()) {
					var homeState = authenticationManager.getHomeState();
					$state.go(homeState.name, homeState.params);
				}
			});

			return authenticationPromise;
		}
	};

	var urlParametersList = "?";
	_.forEach(CAR_SEARCH_URL_PARAMETERS_MAP, function(urlParameterMap) {
		urlParametersList += urlParameterMap.urlParameterName + "&";
	});

	urlParametersList = urlParametersList.slice(0, urlParametersList.length - 1)
	$stateProvider
	.state("mappings", {
		url: "/mappings",
		templateUrl: 'view/mappings-page.html',
		controller: 'MappingsTableController',
		data: {
			isAvailable: isAuthenticatedAdmin
		}
	})
	.state("car-search", {
		url: "/car-search" + urlParametersList,
		templateUrl: 'view/car-search.html',
		controller: 'CarSearchController',
		data: {
			isAvailable: isAuthenticated
		}
	})
	.state("dealer-search", {
		url: "/dealer-search",
		templateUrl: 'view/dealer-search.html',
		controller: 'DealerSearchController',
		data: {
			isAvailable: isAuthenticated
		}
	})
	.state("login", {
		url: "/login",
		templateUrl: "view/login.html",
		controller: "LoginController",
		data: {
			isAvailable: isNotAuthenticated
		}
	})
	.state("url-search-api-documentation", {
		url: "/url-search-api-documentation?language",
		templateUrl: "view/url-search-api-documentation.html",
		controller: "UrlSearchApiDocumentationController"
	})
	.state("register", {
		url: "/register",
		templateUrl: "view/register.html",
		controller: "RegistrationController",
		data: {
			isAvailable: isNotAuthenticated
		},
		resolve: {
		isAuthenticated: ["authenticationManager", "$state", function(authenticationManager, $state) {
				var authenticationPromise = authenticationManager.reloadAuthenticatedUserIfNeeded(true);
				authenticationPromise.then(function() {
					if (authenticationManager.isAuthenticated()) {
						var homeState = authenticationManager.getHomeState();
						$state.go(homeState.name, homeState.params);
					}
				});

				return authenticationPromise;
			}]
		}
	})
	.state("forgotPassword", {
		url: "/forgotPassword?id",
		templateUrl: "view/forgot-password.html",
		controller: "ForgotPasswordController",
		resolve: {
		isAuthenticated: ["authenticationManager", "$state", function(authenticationManager, $state) {
				var authenticationPromise = authenticationManager.reloadAuthenticatedUserIfNeeded(true);

				authenticationPromise.then(function() {
					if (authenticationManager.isAuthenticated()) {
						var homeState = authenticationManager.getHomeState();
						$state.go(homeState.name, homeState.params);
					}
				});

				return authenticationPromise;
			}]
		},
		data: {
			isAvailable: isNotAuthenticated
		}
	})
	.state("non-existing-section", {
		views: {
			"@": { template: "Non existing section" }
		}
	});
})
.value("$uiViewScroll", angular.noop)
.run(function($rootScope, $urlRouter, $injector, $state, authenticationManager) {
	$rootScope.$on("$stateChangeStart", function(event, state, params) {
		
		if (!authenticationManager.isAuthenticationStateSynced()) {
			event.preventDefault();
			
			authenticationManager.reloadAuthenticatedUserIfNeeded().then(function() {
				$urlRouter.sync();
			});
		
			return;
		}
		
		var isAvailable = !!(!state.data || !state.data.isAvailable || $injector.invoke(state.data.isAvailable));

		if (!isAvailable) {
			event.preventDefault();
			
			if (authenticationManager.isAuthenticated()) {
				var homeState = authenticationManager.getHomeState();

				$state.go(homeState.name, homeState.params);
			} else {
				authenticationManager.requestedStateData = {
					name: state.name,
					params: params
				};
				$state.go("login");
			}
		}
		
	});
}).run(function(gettextCatalog) {
	gettextCatalog.debug = false;
});