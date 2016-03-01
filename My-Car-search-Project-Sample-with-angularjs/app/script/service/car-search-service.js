"use strict";

angular.module('cardetectiveApp')
.factory('CarSearchService', [
	'$http',
	"APP_CONFIG",
	"SERVICE_PROVIDER_ID",
	"WebServiceCredentials",
	function (
	$http,
	APP_CONFIG,
	SERVICE_PROVIDER_ID,
	webServiceCredentials) {
	
	var findCarsMobile = function(parameters) {
		var mobileDeAuthorization = btoa(webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["MOBILE_DE"]).username + ":" + webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["MOBILE_DE"]).password);

		return $http.get(APP_CONFIG.clientBaseUrl + "mobile.de/car-search/1.0.0/ad/search", {
				timeout: 15000,
				params: parameters,
				headers: {
					"Accept": "application/xml",
					"Authorization": "Basic " + mobileDeAuthorization
				}
		});
	}

	var findCarsPKW = function(parameters) {
		var url = APP_CONFIG.useHttps ? "https://www.pkw.de/api/v1/cars/search" : "http://www.pkw.de/api/v1/cars/search";
		return $http.post(url, 
			parameters,
			{
				withCredentials: false,
				timeout: 15000,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Accept": "application/json"
				}
			}
		);
	}

	var findCarsAutoscout = function(xmlData) {
		var autoscoutAuthorization = btoa(webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["AUTOSCOUT"]).username + ":" + webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["AUTOSCOUT"]).password);

		return $http.post(APP_CONFIG.clientBaseUrl + "autoscout/car-search/",
				xmlData,
				{
					timeout: 15000,
					headers: {
						"Content-Type": "text/xml",
						"SOAPAction": "http://www.autoscout24.com/webapi/IArticleSearch/FindArticles",
						"Accept": "application/xml",
						"Authorization": "Basic " + autoscoutAuthorization
					}
				}
			);
	}

	var findOneMobile = function(data) {
		var id = data.id;
		var mobileDeAuthorization = btoa(webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["MOBILE_DE"]).username + ":" + webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["MOBILE_DE"]).password);

		return $http.get(APP_CONFIG.clientBaseUrl + "mobile.de/car-search/1.0.0/ad/" + id, {
			timeout: 15000,
			headers: {
				"Accept": "application/xml",
				"Authorization": "Basic " + mobileDeAuthorization
			}
		});
	}

	var findOneAutoscout = function(envelope) {
		var autoscoutAuthorization = btoa(webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["AUTOSCOUT"]).username + ":" + webServiceCredentials.getCredentials(SERVICE_PROVIDER_ID["AUTOSCOUT"]).password);

		return $http.post(APP_CONFIG.clientBaseUrl + "autoscout/car-search/",
			envelope,
			{
				timeout: 15000,
				headers: {
					"Content-Type": "text/xml",
					"SOAPAction": "http://www.autoscout24.com/webapi/IArticleSearch/GetArticleDetails",
					"Accept": "application/xml",
					"Authorization": "Basic " + autoscoutAuthorization
				}
			}
		);
	}

	var findOnePKW = function(data) {
		var url = APP_CONFIG.useHttps ? "https://www.pkw.de/api/v1/cars/" : "http://www.pkw.de/api/v1/cars/";
		return $http.get(url + data.id,
			{
				withCredentials: false,
				headers: {
					Accept: "application/json"
				}
			});
	}

	return {
		findCars: function(parameters, providerId) {
			if (providerId == SERVICE_PROVIDER_ID["MOBILE_DE"]) {
				return findCarsMobile(parameters);
			} else if (providerId == SERVICE_PROVIDER_ID["AUTOSCOUT"]) {
				return findCarsAutoscout(parameters);
			} else if (providerId == SERVICE_PROVIDER_ID["PKW"]) {
				return findCarsPKW(parameters);
			}
		},

		findOne: function(data, providerId) {
			if (providerId == SERVICE_PROVIDER_ID["MOBILE_DE"]) {
				return findOneMobile(data);
			} else if (providerId == SERVICE_PROVIDER_ID["AUTOSCOUT"]) {
				return findOneAutoscout(data);
			} else if (providerId == SERVICE_PROVIDER_ID["PKW"]) {
				return findOnePKW(data);
			}
		},

		findDealer: function(parameters) {
			return $http.get(APP_CONFIG.clientBaseUrl + "mobile.de/dealer-search/home/dealerSearch.html", {
				params: parameters,
				headers: {
					"Accept": "application/json"
				}
			});
		}
	}
}]);