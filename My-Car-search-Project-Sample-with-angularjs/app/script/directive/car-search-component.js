"use strict";

angular.module('cardetectiveApp')
.directive('carSearchComponent',
[
'$window',
'ParametersMapperService',
'ngDialog',
'localizationManager',
'$filter',
'authenticationManager',
'profileManager',
'SearchesRestService',
'DataTransformUtil',
'PublishSubscribeChannel',
'ERROR_MESSAGES',
function(
$window,
parametersMapperService,
ngDialog,
localizationManager,
$filter,
authenticationManager,
profileManager,
SearchesRestService,
DataTransformUtil,
PublishSubscribeChannel,
ERROR_MESSAGES) {
	return {
		scope: false,
		templateUrl: "view/car-search-component.html",
		controller: function($scope) {

			var handleCheckboxSelectedChange = function(event, data) {
				if (data && data.optionItem) {
					
					var item = data.optionItem;

					if ($scope.model.carTypes.indexOf(item) != -1 || 
						$scope.model.features.indexOf(item) != -1) {
						
						$scope.findEstimatedCount();
					}
				}
			}

			var handleSortEvent = function(event, data) {
				$scope.sortOrder = !data.order ? REQUEST_PARAMETERS_MAPPING["SORT_ORDER_ASCENDING"] : REQUEST_PARAMETERS_MAPPING["SORT_ORDER_DESCENDING"];
				$scope.sortField = REQUEST_PARAMETERS_MAPPING[data.field];
			}

			var generateRecursiveTabs = function(searchTabsData, subtree, title, afterKey, beforeKey) {
				var afterIndex = _.findIndex(searchTabsData, function(data) {
					return data.key == afterKey;
				});
				var beforeIndex = _.findIndex(searchTabsData, function(data) {
					return data.key == beforeKey;
				});
				var foundIndex = (afterIndex != -1) ? afterIndex + 1: (beforeIndex != -1) ? beforeIndex : -1;

				_.forEach(subtree, function(item) {
					if (!item.items) {
						if (item.selected) {
							if (foundIndex != -1) {
								searchTabsData.splice(foundIndex, 0, {
									key: item.key,
									title: title,
									label: $filter("translate")(item.label),
									itemContainer: subtree,
									selectedProperyName: "selected",
									originalItemKeyPropertyName: "key"
								});
							} else {
								searchTabsData.push({
									key: item.key,
									title: title,
									label: $filter("translate")(item.label),
									itemContainer: subtree,
									selectedProperyName: "selected",
									originalItemKeyPropertyName: "key"
								});
							}
						}
					} else {
						generateRecursiveTabs(searchTabsData, item.items, title, afterKey, beforeKey);
					}
				});
			}

			var generateSearchTabsModel = function() {
				var searchTabs = [];
				_.forEach($scope.removableTabsProperties, function(tabProperty) {
					if ($scope.model[tabProperty.key]) {
						var propertyModel = $scope.model[tabProperty.key];
						searchTabs.push({
							key: tabProperty.key,
							title: tabProperty.title,
							postLabel: tabProperty.postLabel,
							label: tabProperty.filter ? 
								$filter(tabProperty.filter)(tabProperty.innerProperty ? propertyModel[tabProperty.innerProperty] : propertyModel) :
								tabProperty.innerProperty ? propertyModel[tabProperty.innerProperty] : propertyModel
						});
					}
				});

				generateRecursiveTabs(searchTabs, $scope.model.fuelTypes, "", "maximalPower", "selectedGearbox");
				generateRecursiveTabs(searchTabs, $scope.model.carTypes, "");
				generateRecursiveTabs(searchTabs, $scope.model.features, "");
				generateRecursiveTabs(searchTabs, $scope.model.parkingAssistants, "");
				generateRecursiveTabs(searchTabs, $scope.model.colors, "");
				generateRecursiveTabs(searchTabs, $scope.model.interiorColors, "");
				$scope.model.searchTabs = searchTabs;
			}

			var handleTabItemRemoved = function(event, data) {
				if (data && data.tabItem) {
					var tabItem = data.tabItem;

					if (tabItem.itemContainer && tabItem.selectedProperyName && tabItem.originalItemKeyPropertyName) {
						_.forEach(tabItem.itemContainer, function(item) {
							if (item[tabItem.originalItemKeyPropertyName] == tabItem.key) {
								item[tabItem.selectedProperyName] = false;
							}
						});
					}

					$scope.model[tabItem.key] = null;
					$scope.selectedAd = null;
					$scope.prepareAndStartSearch();
				}
				
			}

			var handleCarItemClicked = function(event, data) {
				$scope.selectedAd = data.rowData;
			}

			var handleResultListVisibleChange = function(newValue, oldValue) {
				if (!!newValue != !!oldValue) {
					$scope.selectedAd = null;
				}
			}

			$scope.$watch("resultListVisible", handleResultListVisibleChange);
			
			$scope.determineSearchAvailability = function() {
				if (!$scope.model.pendginCountCalculationProviderIds || $scope.model.pendginCountCalculationProviderIds.length == 0) {
					var count = $scope.model.mobileResultsEstimatedCount +
								$scope.model.autoscoutResultsEstimatedCount +
								$scope.model.pkwResultsEstimatedCount;
					$scope.model.searchForbidden = false;

					$scope.model.searchEnabled = count > 0;
					$scope.model.estimatedResultCount = count;
					$scope.model.estimatingResultCount = false;
				}
			}

			$scope.$on("tabItemRemoved", handleTabItemRemoved);
			$scope.$on("sortEvent", handleSortEvent);
			$scope.$on("customCheckboxStateChanged", handleCheckboxSelectedChange);
			$scope.$on("carItemClicked", handleCarItemClicked);

			$scope.makesGroupingMethod = function(item) {
				if (item.isImportant) {
					return "";
				}

				return "<hr style='width: 100%'></hr>";
			}
			
			$scope.handleClearSearchParametersButtonClick = function() {
				if (isSearchModelChanged()) {
					$scope.clearSearchParams();
					$scope.clearVinSearchForm();
					$scope.findEstimatedCount();
				}
			}

			$scope.handleClearFeaturesButtonClick = function() {
				setTreeItemsPropertyValue($scope.model.features, "selected", false);
			}

			$scope.showDialog = function(options) {
				return ngDialog.open(options);
			}

			var startVinSearchIfPossible = function() {
				var roles = profileManager.getRoles();
				if (roles.indexOf("EXPERT") < 0) {
					$scope.showDialog({
						template: "<p>{{ 'You are not allowed to use VIN query!' | translate }}</p>",
						plain: true,
						className: 'ngdialog-theme-default'
					});

					return;
				}

				if (!$scope.model.vincode || $scope.model.vincode.length != 17) {
						$scope.showDialog({
							template: "<p>{{ 'The vin number is invalid' | translate }}</p>",
							plain: true,
							className: 'ngdialog-theme-default'
						});

						return;
				}

				var currentLocale = localizationManager.getCurrentLocale();

				var firstRegistrationMoment;
				var registrationDateValid = _.some([currentLocale.monthYearFormat, currentLocale.yearFormat, currentLocale.dayMonthYearFormat], function(format) {
					firstRegistrationMoment = new moment($scope.model.firstRegistrationYear, format, true);
					return firstRegistrationMoment.isValid();
				});

				if (!registrationDateValid) {
					$scope.showDialog({
						template: "<p>{{ 'The first registration year is invalid' | translate }}</p>",
						plain: true,
						className: 'ngdialog-theme-default'
					});

					return;
				}

				$scope.triggerVinSearch($scope.model.vincode, firstRegistrationMoment.format("YYYY-MM-DD"), $scope.model.vinSearchMileage);
			}

			$scope.handleVinInputKeyPress = function(event) {
				if (event.keyCode == 13) {	// Enter
					startVinSearchIfPossible();
				}
			}

			$scope.handleVinSearchButtonClick = function() {
				startVinSearchIfPossible();
			}

			$scope.handleMakeChange = function() {
				var make = $scope.model.selectedCarMaker;
				var model = $scope.model.selectedModel;
				if (!make || !model || make.models.indexOf(model) == -1) {
					$scope.model.selectedModel = null;
				}
				
				$scope.findEstimatedCount();
			}

			$scope.handleModelChange = function() {
				$scope.model.associateModelsToGroup = [];
				if (!$scope.model.selectedModel) {
					$scope.findEstimatedCount();
					return;
				}
				
				if ($scope.model.selectedModel.isModelGroup) {
					var models = $scope.model.selectedCarMaker.models;
					_.forEach(models, function(model) {
						if (model.modelGroupKey == $scope.model.selectedModel.modelGroupKey && !model.isModelGroup) {
							$scope.model.associateModelsToGroup.push(model);
						}
					});
				}
				$scope.findEstimatedCount();
			}

			$scope.handleMinimalPriceChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMaximalPriceChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleZipCodeChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleRadiusChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedCategoryChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleVersionChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMinimalYearChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMaximalYearChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedCondiotionChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedSellerTypeChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleDoorCountChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleFuelTypeChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleGearboxChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMinimalPowerChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMaximalPowerChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMinimalMileageChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMaximalMileageChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMinimalSeatsChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleMaximalSeatsChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleColorChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleEmissionClassChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleEmissionStickerChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleAdAgeChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleAccidentVehicllesInclusionDataChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedClimatisationChange = function() {
				$scope.findEstimatedCount();
			}
			
			$scope.handleSelectedInteriorColorChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedInteriorTypeChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedAirbagChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedCountryChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSelectedVatableOptionChange = function() {
				$scope.findEstimatedCount();
			}

			$scope.handleSaveSearchClick = function(event) {
				var dialog = $scope.showDialog({
					template: "view/popup/save-search-remark.html",
					className: 'ngdialog-theme-default',
					showClose: true,
					closeByEscape: false,
					closeByDocument: false
				});

				dialog.closePromise.then(function(result) {
					if (result.value != "$closeButton") {
						finishSearchSave(result.value);
					}
				});
			}

			var areRequiredFieldsPopulatedForSave = function(searchCriteria) {
				return searchCriteria.make && searchCriteria.model;
			}

			var finishSearchSave = function(searchRemark) {
				var searchCriteria = DataTransformUtil.buildSearchCriteriaForSave($scope.model, profileManager.getSelectedServiceProviders());
				if (!areRequiredFieldsPopulatedForSave(searchCriteria)) {
					$scope.showDialog({
						template: "<p>{{ 'Please fill in at least Maker and model for storing the search!' | translate }}</p>",
						plain: true,
						className: 'ngdialog-theme-default'
					});
					return;
				}

				var carList = DataTransformUtil.buildAdsListForSave($scope.searchResult);
				SearchesRestService.saveSearch(searchRemark, carList, $scope.allDuplicatesMap, searchCriteria);
			}


			$scope.handleLoadSearchButtonClick = function(event) {
				var loadSearchDetailsDialogId = null;

				var loadSearchDetails = function(searchId, loadFreshData) {
					SearchesRestService.loadSearchDetails(profileManager.getProfile().id, searchId).then(
						function(response) {
							ngDialog.close(loadSearchDetailsDialogId);

							if (loadFreshData) {
								$scope.loadedSearch = true;
								$scope.clearSearchParams();
								// Here we index response.data with 0 because currently we receive only one search with this
								// name but there might be more in future.
								$scope.populateLoadedSearch(response.data[0]);
								generateSearchTabsModel();
								
								$scope.loadedResultMap = DataTransformUtil.buildMapFromResultList(response.data[0].ads);
								$scope.loadedResultDuplicatesMap = response.data[0].duplicates || {};

								$scope.prepareAndStartSearch();
								setResultListVisibility(true);
							} else {
								$scope.searchResult = response.data[0].ads;
							}
					});
				}

				var deleteSearch = function(searchIndex, searches, event) {
					event.stopPropagation();

					var promise = SearchesRestService.deleteSearch(profileManager.getProfile().id, searches[searchIndex]._id);
					promise.then(function(response) {
						searches.splice(searchIndex, 1);
					});
				}

				var promise = SearchesRestService.loadAllSavedSearches(profileManager.getProfile().id);
				promise.then(function(response) {
					loadSearchDetailsDialogId = $scope.showDialog({
						template: 'view/popup/load-search-popup.html',
						className: 'ngdialog-theme-default',
						data: {
							searches: response.data,
							loadSearchDetailsCallback: loadSearchDetails,
							deleteSearchCallback: deleteSearch,
							makesMapping: $scope.MAKES,
							lookupData: $scope.dropDownOptions,
							moment: moment
						}
					});
				});
			}

			$scope.handleCancelSearchButtonClick = function(event) {
				$scope.cancelSearch();
			}

			$scope.$on("checkboxTreeNodeItemStateChanged", function(event, data) {
				$scope.findEstimatedCount();
			});


			$scope.handleNewSearchButtonClick = function(event) {
				$scope.cancelSearch();
				$scope.clearSearchParams();
				$scope.clearVinSearchForm();
				setResultListVisibility(false);
				$scope.findEstimatedCount();
				$window.scrollTo(0, 0);
			}

			$scope.handleEditSearchButtonClick = function(event) {
				$scope.cancelSearch();
				setResultListVisibility(false);
				$window.scrollTo(0, 0);
			}

			var setResultListVisibility = function(isVisible) {
				$scope.resultListVisible = isVisible;
			}

			var getReportTypeErrorCode = function(reportType, carList) {
				if (carList.length <= 0) {
					return "EMPTY_SELECTION";
				}

				var isAnyDeleted = carList.some(function(car) { return car.deleted });
				if (isAnyDeleted && reportType == "DETAILED") {
					return "DELETED_VEHICLES_IN_SELECTION";
				}

				return "";
			}

			$scope.handleExportExcelButtonClick = function(event) {
				var carList = DataTransformUtil.buildSelectedAdsListForExport($scope.searchResult, $scope.makes, $scope.FEATURES, $scope.dropDownOptions);

				var reportTypeErrorCode = getReportTypeErrorCode("", carList);

				if (reportTypeErrorCode == "") {
					$scope.exportCarListToExcel(carList);
				} else {
					ngDialog.open({
						template: "<p>{{ '" + ERROR_MESSAGES[reportTypeErrorCode] + "' | translate }}</p>",
						plain: true,
						className: "ngdialog-theme-default"
					});
				}
			}

			$scope.handlePdfExportButtonClick = function(event, reportType, role) {
				var carList = DataTransformUtil.buildSelectedAdsListForExport($scope.searchResult, $scope.makes, $scope.FEATURES, $scope.dropDownOptions);
				var searchCriteria = DataTransformUtil.buildSearchCriteriaForExport($scope.model, profileManager.getSelectedServiceProviders());
				var filterData = DataTransformUtil.buildFilterDataForExport($scope.filter);

				var reportTypeErrorCode = getReportTypeErrorCode(reportType, carList);

				if (reportTypeErrorCode == "") {
					$scope.exportCarListToPdf(carList, searchCriteria, filterData, reportType, role);
				} else {
					ngDialog.open({
						template: "<p>{{ '" + ERROR_MESSAGES[reportTypeErrorCode] + "' | translate }}</p>",
						plain: true,
						className: "ngdialog-theme-default"
					});
				}
			}

			$scope.handleSearchButtonClick = function(event) {
				if ($scope.model.searchEnabled) {
					$scope.loadedSearch = false;
					setResultListVisibility(true);

					generateSearchTabsModel();

					$scope.prepareAndStartSearch();
				}
			}

			var populateMinimalAndMaximalValues = function(actualValue, collectionId, minimalParameterName, maximalParameterName) {
				var currentMinimal = null;
				var currentMaximal = null;

				_.forEach($scope.dropDownOptionsArrays[collectionId], function(dataItem) {
					var integerValue = parseInt(dataItem.key);

					if (integerValue <= actualValue && (!currentMinimal || parseInt(currentMinimal.key) <= integerValue)) {
						currentMinimal = dataItem;
					}

					if (actualValue <= integerValue && (!currentMaximal || integerValue <= parseInt(currentMaximal.key))) {
						currentMaximal = dataItem;
					}
				});

				$scope.model[minimalParameterName] = currentMinimal;
				$scope.model[maximalParameterName] = currentMaximal;
			}

			var populateYears = function(data) {
				_.forEach($scope.dropDownOptionsArrays["YEARS"], function(yearData) {
					if (parseInt(yearData.key) == data.minimalYear) {
						$scope.model.minimalYear = yearData;
					}

					if (parseInt(yearData.key) == data.maximalYear) {
						$scope.model.maximalYear = yearData;
					}
				});
			}

			var populateFeatures = function(data) {
				var IDS_TO_FEATURES = parametersMapperService.getReversedFeatures("SILVERDAT");

				if (data.equipment) {
					var featureKeys = [];
					for (var i = 0; i < data.equipment.length; i++) {
						if (IDS_TO_FEATURES[data.equipment[i]]) {
							featureKeys.push(IDS_TO_FEATURES[data.equipment[i]].key);
						}
					}

					for (var i = 0; i < $scope.model.features.length; i++) {
						if (featureKeys.indexOf($scope.model.features[i].key) != -1) {
							$scope.model.features[i].selected = true;
						}
					}
				}
			}

			var populateMakeAndModel = function(data) {
				var IDS_TO_MAKES = parametersMapperService.getReversedMakers("SILVERDAT");
				
				var makeKey = IDS_TO_MAKES[data.makeId] ? IDS_TO_MAKES[data.makeId].name : null;

				_.forEach($scope.dropDownOptionsArrays.MAKES, function(make) {
					if (make.key == makeKey) {
						$scope.model.selectedCarMaker = make;
					}
				});

				var modelKey = IDS_TO_MAKES[data.makeId] && IDS_TO_MAKES[data.makeId].models[data.modelId] ?
					IDS_TO_MAKES[data.makeId].models[data.modelId].model : null;

				if ($scope.model.selectedCarMaker && modelKey) {
					_.forEach($scope.model.selectedCarMaker.models, function(model) {
						if (model.key == modelKey) {
							$scope.model.selectedModel = model;
						}
					});
				}
			}

			$scope.populateCarSearchForm = function(data) {
				$scope.clearSearchParams();
				
				populateMakeAndModel(data);
				populateFeatures(data);

				populateMinimalAndMaximalValues(data.estimatedMileage, "MILEAGE", "minimalMileage", "maximalMileage");
				populateMinimalAndMaximalValues(data.powerInKw, "POWER", "minimalPower", "maximalPower");

				populateYears(data);

				$scope.model.selectedDoors = data.doorKey ? $scope.dropDownOptions["DOOR_COUNT"][data.doorKey] : null;
				$scope.model.minimalSeats = data.seats ? $scope.dropDownOptions["SEATS"][data.seats]: null;
				
				$scope.model.selectedFuelType = data.fuelKey ? $scope.dropDownOptions["FUEL"][data.fuelKey] : null;
				$scope.model.selectedGearbox = data.gearboxKey ? $scope.dropDownOptions["GEARBOX"][data.gearboxKey] : null;

				$scope.model.selectedClimatisation = data.climatisationKey ? $scope.dropDownOptions["CLIMATISATION"][data.climatisationKey] : null;
				$scope.model.selectedInteriorType = data.interiorTypeKey ? $scope.dropDownOptions["INTERIOR_TYPE"][data.interiorTypeKey] : null;
				$scope.model.selectedAirbag = data.airbagKey ? $scope.dropDownOptions["AIRBAG"][data.airbagKey] : null;

				$scope.model.datCode = data.datCode;
				$scope.model.vatType = data.vatType;
				$scope.model.datSalesPriceGross = data.salesPriceGross;
				$scope.model.datSalesPrice = data.salesPrice;
				$scope.model.datPurchasePriceGross = data.purchasePriceGross;

				$scope.model.datInformation = {};
				$scope.model.datInformation.kbaNumbers = data.kbaNumbers;
				$scope.model.datInformation.valuationData = data.valuationData;
				$scope.model.datInformation.vatData = data.vatData;
				$scope.model.datInformation.vehicleDetailData = data.vehicleDetailData;

				$scope.vinSearchLoading = false;

				$scope.findEstimatedCount();
			}

			var isSelectableItemsTreeChanged = function(subtree) {
				var result = false;

				_.forEach(subtree, function(node) {
					result = result || node.selected || (node.items && isSelectableItemsTreeChanged(node.items));
				});

				return result;
			}

			var isSearchModelChanged = function() {
				var model = $scope.model;

				var result = model.vincode || model.firstRegistrationYear || model.vinSearchMileage || 
					model.zipCode || model.zipSearchRadius || model.selectedCarCategory ||
					model.minimalYear || model.maximalYear || model.selectedCondition || 
					model.selectedSellerType || model.selectedDoors || 
					model.selectedGearbox || model.selectedCarMaker || model.selectedModel ||
					model.minimalPower || model.maximalPower || model.minimalPrice || 
					model.maximalPrice || model.minimalMileage || model.maximalMileage ||
					model.minimalSeats || model.maximalSeats || 
					model.selectedEmissionClass || model.selectedEnvironmentBadge ||
					model.selectedAdAge || model.accidentVehiclesInclusionData || model.carModelVersion || 
					model.selectedClimatisation || model.selectedInteriorType ||
					model.selectedAirbag || model.selectedCountry || model.selectedVatableOption;

				result = result || isSelectableItemsTreeChanged($scope.model.fuelTypes);
				result = result || isSelectableItemsTreeChanged($scope.model.features);
				result = result || isSelectableItemsTreeChanged($scope.model.carTypes);
				result = result || isSelectableItemsTreeChanged($scope.model.parkingAssistants);
				result = result || isSelectableItemsTreeChanged($scope.model.colors);
				result = result || isSelectableItemsTreeChanged($scope.model.interiorColors);

				return result;

			}

			$scope.clearVinSearchForm = function() {
				$scope.model.vincode = "";
				$scope.model.firstRegistrationYear = "";
				$scope.model.vinSearchMileage = "";
			}

			var setTreeItemsPropertyValue = function(subtree, propertyName, value) {
				_.forEach(subtree, function(node) {
					node[propertyName] = value;
					setTreeItemsPropertyValue(node.items, propertyName, value);
				});
			}

			$scope.clearSearchParams = function() {
				$scope.$broadcast("resetActiveIndex");

				$scope.model.zipCode = "";
				$scope.model.zipSearchRadius = "";
				$scope.model.selectedCarCategory = "";
				$scope.model.minimalYear = "";
				$scope.model.maximalYear = "";
				$scope.model.selectedCondition = "";
				$scope.model.selectedSellerType = "";
				$scope.model.selectedDoors = "";
				$scope.model.selectedFuelType = "";
				$scope.model.selectedGearbox = "";
				$scope.model.selectedCarMaker = "";
				$scope.model.selectedModel = "";
				$scope.model.minimalPower = "";
				$scope.model.maximalPower = "";
				$scope.model.minimalPrice = "";
				$scope.model.maximalPrice = "";
				$scope.model.minimalMileage = "";
				$scope.model.maximalMileage = "";
				$scope.model.minimalSeats = "";
				$scope.model.maximalSeats = "";
				$scope.model.selectedEmissionClass = "";
				$scope.model.selectedEnvironmentBadge = "";
				$scope.model.selectedAdAge = "";
				$scope.model.accidentVehiclesInclusionData = "";
				$scope.model.carModelVersion = "";
				$scope.selectedAd = null;
				$scope.model.vatType = "";
				$scope.model.datInformation = {};
				$scope.model.datSalesPriceGross = "";
				$scope.model.datPurchasePriceGross = "";
				$scope.model.selectedClimatisation = "";
				$scope.model.selectedInteriorType = "";
				$scope.model.selectedAirbag = "";
				$scope.model.selectedCountry = "";
				$scope.model.selectedVatableOption = "";
				
				setTreeItemsPropertyValue($scope.model.fuelTypes, "selected", false);
				setTreeItemsPropertyValue($scope.model.carTypes, "selected", false);
				setTreeItemsPropertyValue($scope.model.parkingAssistants, "selected", false);
				setTreeItemsPropertyValue($scope.model.features, "selected", false);
				setTreeItemsPropertyValue($scope.model.colors, "selected", false);
				setTreeItemsPropertyValue($scope.model.interiorColors, "selected", false);

				$scope.populateDefaultValues();
			}
		}
	}	
}
])