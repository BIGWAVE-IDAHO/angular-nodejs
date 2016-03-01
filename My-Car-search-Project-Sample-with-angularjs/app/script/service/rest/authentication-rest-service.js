"use strict";

angular.module("cardetectiveApp")
.factory("authenticationRestService", ['$http', 'APP_CONFIG', function($http, APP_CONFIG) {
	
	return {
		authenticate: function(username, password, rememberMe) {
			var expiredPasswordUrlPattern = APP_CONFIG.clientBaseUrl + "forgotPassword" + "?id={0}";

			return $http.post(APP_CONFIG.serviceBaseUrl + "authentication", 
				{"username": username, "password": password, "rememberMe": rememberMe, "urlPattern": expiredPasswordUrlPattern}, {
					headers: {"Content-Type": "application/x-www-form-urlencoded"}
				}
			);
		},
		
		getAuthenticatedUser: function() {
			return $http.get(APP_CONFIG.serviceBaseUrl + "authentication/authenticated");
		},
		
		isAuthenticated: function() {
			return $http.get(APP_CONFIG.serviceBaseUrl + "authentication/isAuthenticated");
		},

		logout: function() {
			return $http.get(APP_CONFIG.serviceBaseUrl + "authentication/logout");
		},

		pollServerForRefresh: function() {
			return $http.get(APP_CONFIG.serviceBaseUrl + "authentication/refresh");
		},

		changePassword: function(oldPassword, newPassword) {
			return $http.post(APP_CONFIG.serviceBaseUrl + "authentication/password", {
						"value": newPassword,
						"old": oldPassword
					}, {
							headers: {
							"Content-Type": "application/x-www-form-urlencoded"
						}
					});
		}
	};
}]);