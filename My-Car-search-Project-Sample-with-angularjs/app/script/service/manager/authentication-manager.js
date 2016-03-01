"use strict";

angular.module("cardetectiveApp")
.factory("authenticationManager", 
[
"$q", 
"$state", 
"authenticationRestService",
"SERVICE_PROVIDER_ID",
"WebServiceCredentials",
"$timeout",
function(
$q, 
$state,
authenticationRestService,
SERVICE_PROVIDER_ID,
webServiceCredentials,
$timeout) {

	var refreshSessionInterval = 60 * 1000;

	var sessionTimeoutId;

	var isAuthenticationStateSynced = false;
	var _authenticatedUser = null;
	var _requestedPath = "";
	var pollTimeoutId;
	var lastGetAuthenticatedUserError = "";

	var refreshSession = function() {
		if (!!(_authenticatedUser)) {
			var authenticationPromise = authenticationRestService.pollServerForRefresh();
			authenticationPromise.then(handleRefreshSuccess, handleRefreshFail);		
		} else {
			cancelSessionRefreshRoutine();
		}
	}

	var triggerSessionRefreshRoutine = function() {
		refreshSession();
	}

	var cancelSessionRefreshRoutine = function() {
		if (sessionTimeoutId) {
			clearTimeout(sessionTimeoutId);
		}
	}

	var handleGetAuthenticatedUserSuccess = function(result, deffered) {
		isAuthenticationStateSynced = true;
		_authenticatedUser = result.data;
		triggerSessionRefreshRoutine();
		if (result.data.credentials) {
			setWebServiceCredentials(result.data.credentials, result.data.id.toString());
		}
		if (result.data.profile) {
			var profile = result.data.profile;
			_authenticatedUser.profile = profile;

			setDatCredentials(profile.datCustomerName,
							  profile.datCustomerNumber,
							  profile.datCustomerCertificate);
		}

		deffered.resolve();
	};

	var handleGetAuthenticatedUserFail = function(error, deffered) {
		_authenticatedUser = null;
		if (error && error.data) {
			$timeout(function() {lastGetAuthenticatedUserError = error.data.error}, 0);
		}
		deffered.reject(error);

		cancelSessionRefreshRoutine();
		

		$state.go("login");	
	};
	
	var handleAuthenticateSuccess = function(result, deffered) {
		_authenticatedUser = result.data;
		triggerSessionRefreshRoutine();
		if (result.data.credentials) {
			setWebServiceCredentials(result.data.credentials, result.data.id.toString());
		}
		if (result.data.profile) {
			var profile = result.data.profile;
			
			_authenticatedUser.profile = profile;

			setDatCredentials(profile.datCustomerName,
							  profile.datCustomerNumber,
							  profile.datCustomerCertificate);
		}
		deffered.resolve(true);
	};

	var handleAuthenticateFail = function(error, deffered) {
		_authenticatedUser = null;
		cancelSessionRefreshRoutine();

		deffered.reject(error.data.error);
	};
	
	var handleLogoutSuccess = function(result) {
		cancelSessionRefreshRoutine();
		$state.go("login");
	}

	var handleLogoutFail = function(error) {
		_authenticatedUser = null;
		cancelSessionRefreshRoutine();
		$state.go("login");
	}

	var handleRefreshSuccess = function(result) {
		sessionTimeoutId = setTimeout(refreshSession, refreshSessionInterval);
	}

	var handleRefreshFail = function(error) {
		if (error && error.data && error.data.error && error.data.error == "AUTHENTICATION_ERROR") {
			_authenticatedUser = null;
			cancelSessionRefreshRoutine();
			$state.go("login");
		}
		
	}
	
	var setWebServiceCredentials = function(credentials, key) {
		webServiceCredentials.setProviderCredentials(credentials.AUTOSCOUT, SERVICE_PROVIDER_ID["AUTOSCOUT"], key);
		webServiceCredentials.setProviderCredentials(credentials.MOBILE_DE, SERVICE_PROVIDER_ID["MOBILE_DE"], key);
		webServiceCredentials.setProviderCredentials(credentials.SILVERDAT, SERVICE_PROVIDER_ID["SILVERDAT"], key);
	}

	var handleCredentialsFail = function(error) {
		console.log(error);
	}

	var handleChangePasswordSuccess = function(result, deferred) {
		_.assign(_authenticatedUser, result.data);
		deferred.resolve(true);
	}

	var handleChangePasswordFail = function(error, deferred) {
		deferred.reject(error);
	}

	var setDatCredentials = function(username, customerNumber,
									 customerSignature) {

		if (username && customerNumber && customerSignature) {
			
			var credentials = {
				username: username,
				customerNumber: customerNumber,
				customerSignature: customerSignature
			};

			_authenticatedUser.datCredentials = credentials;
		} else {
			_authenticatedUser.datCredentials = null;
		}
	}

	return {
		authenticate: function(username, password, rememberMe) {
			var result = !!(_authenticatedUser);
			var deffered = $q.defer();
			
			if (!result) {
				authenticationRestService.authenticate(username, password, rememberMe)
					.then(_.partialRight(handleAuthenticateSuccess, deffered),
						_.partialRight(handleAuthenticateFail, deffered));
			} else {
				deffered.resolve(result);
			}

			return deffered.promise;
		},
		
		reloadAuthenticatedUserIfNeeded: function(forceReload) {
			var deferred = $q.defer();
			lastGetAuthenticatedUserError = "";

			if (!this.isAuthenticationStateSynced() || forceReload) {
				authenticationRestService.getAuthenticatedUser()
				.then(_.partialRight(handleGetAuthenticatedUserSuccess, deferred),
					_.partialRight(handleGetAuthenticatedUserFail, deferred));
			}
			else {
				deferred.resolve(this.isAuthenticated());
			}
			
			return deferred.promise;
		},
		
		isAuthenticated: function() {
			return !!(_authenticatedUser);
		},

		isAuthenticationStateSynced: function() {
			return isAuthenticationStateSynced;
		},
		
		logout: function() {
			_authenticatedUser = null;
			 
			var logoutPromise = authenticationRestService.logout();

			logoutPromise.then(handleLogoutSuccess, handleLogoutFail);
		},
		
		requestedPath: _requestedPath,
		
		hasRight: function(right) {
			return !!(_authenticatedUser) && _.some(_authenticatedUser.roles,
				function (role) {
					return role.rights && role.rights.indexOf(right) !== -1;
				}
			);
		},
		
		getPostLoginState: function() {
			return this.requestedStateData || this.getHomeState();
		},
		
		getHomeState: function() {
			var state = {name: "car-search", params: {}}
			
			return state;
		},

		changePassword: function(oldPassword, newPassword) {
			var deferred = $q.defer();

			authenticationRestService.changePassword(oldPassword, newPassword)
				.then(_.partialRight(handleChangePasswordSuccess, deferred), 
					_.partialRight(handleChangePasswordFail, deferred));


			return deferred.promise;
		},

		getAuthenticatedUserId: function() {
			return _authenticatedUser ? _authenticatedUser.id : null; 
		},

		getAuthenticatedUserDatCredentials: function() {
			return _authenticatedUser ? _authenticatedUser.datCredentials : null;
		},

		setAuthenticatedUserDatCredentials: function(username, customerNumber,
													 customerCertificate) {
			if (_authenticatedUser) {
				setDatCredentials(username, customerNumber,
								  customerCertificate);
			}
		},

		getProfile: function() {
			return _authenticatedUser ?
				 _authenticatedUser.profile : null;
		},

		setProfile: function(profile) {
			if (_authenticatedUser && profile) {
				_.assign(_authenticatedUser.profile, profile);
			}
		},

		cookieTheftAttackDetected: function() {
			return lastGetAuthenticatedUserError == "POSSIBLE_COOKIE_THEFT";
		}
	};
	
}]);