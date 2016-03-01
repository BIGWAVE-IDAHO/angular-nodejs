'use strict';

angular.module('cardetectiveApp')
.controller(
'ApplicationController', 
[
"$scope",
"APP_CONFIG",
"ProvidersMappingRestService",
"ParametersMapperService",
"authenticationManager",
"SERVICE_PROVIDER_ID",
"localizationManager",
"LookupDataRestService",
"LookupDataService",
"profileRestService",
'ngDialog',
"ParkingRestService",
"profileManager",
"PasswordRulesService",
"ERROR_MESSAGES",
function(
$scope,
APP_CONFIG,
ProvidersMappingRestService,
parametersMapperService,
authenticationManager,
SERVICE_PROVIDER_ID,
localizationManager,
LookupDataRestService,
LookupDataService,
profileRestService,
ngDialog,
ParkingRestService,
profileManager,
PasswordRulesService,
ERROR_MESSAGES
) {
	$scope.authenticationManager = authenticationManager;
	$scope.profileManager = profileManager;
	$scope.applicationModel = {};
	
	$scope.applicationModel.locales = localizationManager.supportedLocales;
	localizationManager.setCurrentLocale("de-de");

	$scope.applicationModel.selectedLocale = localizationManager.getCurrentLocale();

	$scope.honorificsMap = {"MALE": "Mr", "FEMALE": "Mrs"};
	
	$scope.handleLocaleChange = function(event) {
		localizationManager.setCurrentLocale($scope.applicationModel.selectedLocale.id);
	}

	$scope.$watch("authenticationManager.isAuthenticated()", function(newValue, oldValue) {
		if (newValue == true && newValue !== oldValue) {
			var profile = profileManager.getProfile();
			var promise = ParkingRestService.getCarsByUser(profile.id);
			promise.then(function(response) {
				profileManager.setParkedCars(response.data);
			});
		}
	});


	$scope.$watch("authenticationManager.cookieTheftAttackDetected()", function(newValue, oldValue) {

		if (!!newValue && newValue !== oldValue) {
			ngDialog.open({
				template: "<p class='cookie-theft-attack-message'>{{ 'We have detected possible cookie theft attack. Please contact our adminstrators and immediately change your credentials' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		}
	});

	var handleLocaleChangeRequest = function(event, data) {
		var localeId = data.localeId;
		localizationManager.setCurrentLocale(localeId);
	}

	$scope.$on("localeChangeRequest", handleLocaleChangeRequest);

	LookupDataService.awaitForCollection("makers", function(makers) {
		$scope.MAKES = makers;
	});

	$scope.APP_CONFIG = APP_CONFIG;
	$scope.buildDate = new moment(APP_CONFIG.timestamp).format("MMMM Do YYYY, hh:mm:ss a");
	$scope.logoutButtonVisible = false;

	var handleSearchParametersFail = function(error) {
		console.debug(error);
	}

	var handleSearchParametersSuccess = function(response, providerId) {
		parametersMapperService.setProviderMappings(providerId, response.data);
	}

	var handleMakersSuccess = function(response, providerId) {
		parametersMapperService.setProviderMakers(providerId, response.data.straight);
		parametersMapperService.setReversedMakers(providerId, response.data.reverse);
	}

	var handleDropDownsSuccess = function(response, providerId) {
		parametersMapperService.setDropDowns(providerId, response.data.straight);
		parametersMapperService.setReversedDropDowns(providerId, response.data.reverse);
	}

	var handleFeaturesSuccess = function(response, providerId) {
		parametersMapperService.setFeaturesMapping(providerId, response.data.straight);
		parametersMapperService.setReversedFeatures(providerId, response.data.reverse);
	}

	var handleModelGroupsSuccess = function(response) {
		parametersMapperService.setModelGroups(response.data.straight);
	}

	var handleDropDownModelGroupsSuccess = function(response) {
		LookupDataService.setCollection("modelGroups", response.data);
	}

	var handleDropDownMakers = function(response) {
		LookupDataService.setCollection("makers", response.data);
	}

	var handleAllDropDowns = function(response) {
		LookupDataService.setCollection("dropDowns", response.data);
	}

	var handleDropDownFeatures = function(response) {
		LookupDataService.setCollection("features", response.data);
	}

	var handleDropDownsFail = function(error) {
		console.log(error);
	}

	_.forEach(SERVICE_PROVIDER_ID, function(provider) {
		var promise = ProvidersMappingRestService.getMakersModels(provider);
		promise.then(_.partialRight(handleMakersSuccess, provider), handleSearchParametersFail);

		promise = ProvidersMappingRestService.getDropDowns(provider);
		promise.then(_.partialRight(handleDropDownsSuccess, provider), handleSearchParametersFail);

		promise = ProvidersMappingRestService.getFeatures(provider);
		promise.then(_.partialRight(handleFeaturesSuccess, provider), handleSearchParametersFail);
	});

	var modelGroupsPromise = ProvidersMappingRestService.getModelGroups();
	modelGroupsPromise.then(handleModelGroupsSuccess,
							handleSearchParametersFail);

	modelGroupsPromise = LookupDataRestService.getModelGroups();
	modelGroupsPromise.then(handleDropDownModelGroupsSuccess,
							handleSearchParametersFail);

	var promise = ProvidersMappingRestService.getSearchParameters(SERVICE_PROVIDER_ID["MOBILE_DE"]);
	promise.then(_.partialRight(handleSearchParametersSuccess, SERVICE_PROVIDER_ID["MOBILE_DE"]), handleSearchParametersFail);

	promise = LookupDataRestService.getMakersModels();
	promise.then(handleDropDownMakers, handleDropDownsFail);

	promise = LookupDataRestService.getDropDowns();
	promise.then(handleAllDropDowns, handleDropDownsFail);

	promise = LookupDataRestService.getFeatures();
	promise.then(handleDropDownFeatures, handleDropDownsFail);

	$scope.handleExpandableProfileButtonClick = function() {
		$scope.applicationModel.logoutButtonVisible = !$scope.applicationModel.logoutButtonVisible;
	}

	$scope.handleMyParkingButtonClick = function() {
		$scope.applicationModel.myParkingVisible = !$scope.applicationModel.myParkingVisible;
	}

	$scope.handleLogoutButtonClick = function(event) {
		authenticationManager.logout();
		$scope.applicationModel.logoutButtonVisible = false;
	}

	$scope.isAuthenticated = authenticationManager.isAuthenticated;
	$scope.passwordChanged = authenticationManager.passwordChanged;

	var handleSaveDuplicatePropertiesEvent = function(event, data) {
		var promise = profileRestService.saveProfile({
			duplicateProperties: data
		});

		$scope.savingDataOverlayVisible = true;

		promise.then(function(response) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'Duplicate properties are successfully updated.' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
			authenticationManager.setProfile(response.data);
		}, function(error) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'There was a problem while saving properties. Please try again.' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		});
	}

	var handleSaveDatCredentialsEvent = function(event, data) {
		var promise = profileRestService.saveDatCredentials(data.username,
															data.customerNumber,
															data.password);

		$scope.savingDataOverlayVisible = true;

		promise.then(
			function(response) {
				var profile = response.data;
				authenticationManager.setAuthenticatedUserDatCredentials(profile.datCustomerName,
																		 profile.datCustomerNumber,
																		 profile.datCustomerCertificate);
				$scope.savingDataOverlayVisible = false;
				ngDialog.open({
					template: "<p>{{ 'DAT Credentials are successfully saved' | translate }}</p>",
					plain: true,
					className: "ngdialog-theme-default"
				});
			},
			function(error) {
				$scope.savingDataOverlayVisible = false;
				ngDialog.open({
					template: "<p>{{ 'Some error occurred while saving DAT Credentials' | translate }}</p>",
					plain: true,
					className: "ngdialog-theme-default"
				});
			});
	}

	var handleSaveSelectedServiceProvidersEvent = function(event, data) {
		$scope.savingDataOverlayVisible = true;

		var promise = profileRestService.saveProfile({
			selectedServiceProvidersKeys: data
		});

		promise.then(function(response) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'Service providers are successfully updated' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
			authenticationManager.setProfile(response.data);
		}, function(error) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'There was a problem while saving service providers. Please try again' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		});
	}

	var handleSaveResultPageSize = function(event, data) {
		$scope.savingDataOverlayVisible = true;

		var promise = profileRestService.saveProfile({
			resultPageSize: data
		});

		promise.then(function(response) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'Result page size is successfully saved.' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
			authenticationManager.setProfile(response.data);
		}, function(error) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'There was a problem while saving page size configuration. Please try again.' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		});
	}

	var settingsMenuScope = $scope.$new();

	$scope.handleOpenSettingsMenuButtonClick = function () {
		ngDialog.open({
			controller: "SettingsMenuController",
			scope: settingsMenuScope,
			template: "view/settings/settings-menu.html",
			className: "ngdialog-theme-default"
		});
	}

	settingsMenuScope.$on("saveProfile", function(event, data) {
		var savePromise = profileRestService.saveProfile(data);

		$scope.savingDataOverlayVisible = true;

		savePromise.then(function(response) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'Profile is sucessfully saved' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
			authenticationManager.setProfile(response.data);
		}, function(error) {
			$scope.savingDataOverlayVisible = false;
			ngDialog.open({
				template: "<p>{{ 'There was a problem while saving profile. Please try again' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		});
	});

	settingsMenuScope.$on("savePassword", function(event, data) {
		if (data.newPassword == data.repeatedPassword) {
			var passwordRuleErrorCode = PasswordRulesService.arePasswordRulesAccepted(data.newPassword);

			if (passwordRuleErrorCode != "") {
				ngDialog.open({
					template: "<p>{{ '" + ERROR_MESSAGES[passwordRuleErrorCode] + "' | translate }}</p>",
					plain: true,
					className: "ngdialog-theme-default"
				});

				return;
			}

			var passwordChangePromise = 
				authenticationManager.changePassword(data.oldPassword, data.newPassword);
			
			$scope.savingDataOverlayVisible = true;

			passwordChangePromise.then(function(response) {
				$scope.savingDataOverlayVisible = false;
				ngDialog.open({
					template: "<p>{{ 'Password is successfully changed!' | translate }}</p>",
					plain: true,
					className: "ngdialog-theme-default"
				});
			}, function(error) {
				$scope.savingDataOverlayVisible = false;
				ngDialog.open({
					template: "<p>{{ 'Some error occurred while changing your password. Please try again!' | translate }}</p>",
					plain: true,
					className: "ngdialog-theme-default"
				});
			});
		} else {
			ngDialog.open({
				template: "<p>{{ 'It seems the passwords are not the same' | translate }}</p>",
				plain: true,
				className: "ngdialog-theme-default"
			});
		}
	});
	
	settingsMenuScope.$on("saveDatCredentials", handleSaveDatCredentialsEvent);
	settingsMenuScope.$on("saveDuplicateProperties", handleSaveDuplicatePropertiesEvent);
	settingsMenuScope.$on("saveSelectedServiceProviders", handleSaveSelectedServiceProvidersEvent);
	settingsMenuScope.$on("saveResultPageSize", handleSaveResultPageSize);

	$scope.$on("resultListReordered", function(event, data) {
		var resultColumns = data.headerButtons.map(function(button) {
			return button.id;
		});

		var resultColumnsString = resultColumns.toString();

		var promise = profileRestService.saveProfile({
			resultColumns: resultColumnsString
		});
	});

	$scope.$on("resultListColumnsWidthChanged", function(event, data) {
		var columnsWidth = data.headerButtons.map(function(button) {
			return {
				id: button.id,
				width: button.width
			};
		});

		var columnsWidthAsString = JSON.stringify(columnsWidth);

		var promise = profileRestService.saveProfile({
			columnsWidth: columnsWidthAsString
		});
	});

	var saveCarInParkingSuccess = function(response) {
		var savingCar = $scope.savingCar;
		savingCar.parked = true;
		savingCar.mainImageURL = savingCar.images ? savingCar.images[0]["S"] : "";

		var car = {
			make: $scope.MAKES[savingCar.make] ? $scope.MAKES[savingCar.make].name : "",
			model: $scope.MAKES[savingCar.make].models[savingCar.model] ? $scope.MAKES[savingCar.make].models[savingCar.model].model : "",
			price: savingCar.price,
			mainImageURL: savingCar.images ? savingCar.images[0]["S"] : ""
		};
		if (response.data == "AD_ALREADY_EXISTS") {
			ngDialog.open({
				template: "view/popup/save-car-exists.html",
				className: 'ngdialog-theme-default dialog-save-car',
				data: {
					car: car
				}
			});
		} else {
			ngDialog.open({
				template: "view/popup/save-car-success.html",
				className: 'ngdialog-theme-default dialog-save-car',
				data: {
					car: car
				}
			});

			profileManager.addParkedCars(response.data);
		}
	}

	var saveCarInParkingFail = function(error) {
		ngDialog.open({
			template: "<p>{{ 'Failed to save car in parking. Please try again later.' | translate }}</p>",
			className: 'ngdialog-theme-default',
		});
	}

	var handleSaveCarInMyParking = function(event, data) {
		$scope.savingCar = data;
		var savePromise = ParkingRestService.saveCar(data);

		savePromise.then(saveCarInParkingSuccess, saveCarInParkingFail);
	}

	var handleDeleteCarFromParking = function(event, data) {
		ParkingRestService.deleteCar(data.car).then(function(result) {
			profileManager.deleteParkedCar(data.index);
		}, function(error) {
			console.debug(error);
		});
	}

	$scope.$on("saveCarInMyParking", handleSaveCarInMyParking);
	$scope.$on("deleteCarFromParking", handleDeleteCarFromParking);
}]);