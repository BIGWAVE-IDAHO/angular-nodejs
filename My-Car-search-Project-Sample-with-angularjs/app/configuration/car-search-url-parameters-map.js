'use strict';

angular.module('urlParametersMap', [])
.constant('CAR_SEARCH_URL_PARAMETERS_MAP', {
	make: {
		"urlParameterName": "make",
		"modelName": "selectedCarMaker",
		"collectionPath": "MAKES"
	}, model: {
		"urlParameterName": "model",
		"modelName": "selectedModel",
		"collectionPath": "MAKES.models"
	}, vin: {
		"urlParameterName": "vin",
		"modelName": "vincode"
	}, vinFirstRegistrationYear: {
		"urlParameterName": "vin-search-first-registration-year",
		"modelName": "firstRegistrationYear"
	}, vinSearchMileage: {
		"urlParameterName": "vin-search-mileage",
		"modelName": "vinSearchMileage"
	}, version: {
		"urlParameterName": "version",
		"modelName": "carModelVersion"
	}, gearbox: {
		"urlParameterName": "gearbox",
		"modelName": "selectedGearbox",
		"collectionPath": "GEARBOX"
	}, minimalMileage: {
		"urlParameterName": "minimal-mileage",
		"modelName": "minimalMileage",
		"collectionPath": "MILEAGE"
	}, maximalMileage: {
		"urlParameterName": "maximal-mileage",
		"modelName": "maximalMileage",
		"collectionPath": "MILEAGE"
	}, minimalPower: {
		"urlParameterName": "minimal-power",
		"modelName": "minimalPower",
		"collectionPath": "POWER"
	}, maximalPower: {
		"urlParameterName": "maximal-power",
		"modelName": "maximalPower",
		"collectionPath": "POWER"
	}, fuelTypes: {
		"urlParameterName": "fuel-type",
		"modelName": "fuelTypes",
		"collectionPath": "fuelTypes",
		"multipleSelection": true
	}, selectedCondition: {
		"urlParameterName": "condition",
		"modelName": "selectedCondition",
		"collectionPath": "CONDITION"
	}, color: {
		"urlParameterName": "color",
		"collectionPath": "colors",
		"multipleSelection": true
	}, interiorColor: {
		"urlParameterName": "interior-color",
		"collectionPath": "interiorColors",
		"multipleSelection": true
	}, doors: {
		"urlParameterName": "doors",
		"modelName": "selectedDoors",
		"collectionPath": "DOOR_COUNT"
	}, minimalPrice: {
		"urlParameterName": "minimal-price",
		"modelName": "minimalPrice",
		"collectionPath": "PRICE"
	}, maximalPrice: {
		"urlParameterName": "maximal-price",
		"modelName": "maximalPrice",
		"collectionPath": "PRICE"
	}, accidentVehiclesInclusionData: {
		"urlParameterName": "accident-vehicles",
		"modelName": "accidentVehiclesInclusionData",
		"collectionPath": "ACCIDENT_VEHICLES"
	}, minimalFirstRegistrationYear: {
		"urlParameterName": "minimal-first-registration-year",
		"modelName": "minimalYear",
		"collectionPath": "YEARS"
	}, maximalFirstRegistrationYear: {
		"urlParameterName": "maximal-first-registration-year",
		"modelName": "maximalYear",
		"collectionPath": "YEARS"
	}, minimalSeats: {
		"urlParameterName": "minimal-seats",
		"modelName": "minimalSeats",
		"collectionPath": "SEATS"
	}, maximalSeats: {
		"urlParameterName": "maximal-seats",
		"modelName": "maximalSeats",
		"collectionPath": "SEATS"
	}, emissionClass: {
		"urlParameterName": "euro-norm",
		"modelName": "selectedEmissionClass",
		"collectionPath": "EMISSION_CLASS"
	}, environmentBadge: {
		"urlParameterName": "environement-badge",
		"modelName": "selectedEnvironmentBadge",
		"collectionPath": "EMISSION_STICKER"
	}, zipCode: {
		"urlParameterName": "zip-code",
		"modelName": "zipCode"
	}, zipSearchRadius: {
		"urlParameterName": "radius",
		"modelName": "zipSearchRadius",
		"collectionPath": "ZIP_CODE_SEARCH_RADIUS"
	}, sellerType: {
		"urlParameterName": "seller-type",
		"modelName": "selectedSellerType",
		"collectionPath": "SELLER_TYPE"
	}, adAge: {
		"urlParameterName": "ad-age",
		"modelName": "selectedAdAge",
		"collectionPath": "AD_AGE"
	}, features: {
		"urlParameterName": "features",
		"modelName": "features",
		"collectionPath": "features",
		"multipleSelection": true
	}, carTypes: {
		"urlParameterName": "car-types",
		"collectionPath": "carTypes",
		"multipleSelection": true
	}, vatable: {
		"urlParameterName": "vatable",
		"collectionPath": "vatableData",
		"modelName": "selectedVatableOption"
	}, parkingSensors: {
		"urlParameterName": "parking-sensors",
		"collectionPath": "parkingAssistants",
		"multipleSelection": true
	}, interiorType: {
		"urlParameterName": "interior-type",
		"collectionPath": "INTERIOR_TYPE",
		"modelName": "selectedInteriorType"
	}, country: {
		"urlParameterName": "country",
		"collectionPath": "COUNTRY",
		"modelName": "selectedCountry"
	}, airConditioning: {
		"urlParameterName": "air-conditioning",
		"collectionPath": "CLIMATISATION",
		"modelName": "selectedClimatisation"
	}, salesPriceGross: {
		"urlParameterName": "sales-price-gross",
		"collectionPath": "",
		"modelName": "salesPriceGrossURL"
	}, purchasePriceGross: {
		"urlParameterName": "purchase-price-gross",
		"collectionPath": "",
		"modelName": "purchasePriceGrossURL"
	}
});