"use strict";

angular.module("cardetectiveApp")
.directive("cardetectiveSettings",
[
function () {
	return {
		templateUrl: "view/settings/cardetective-settings.html",
		
		scope: {
			duplicateProperties: "=",
		},
		controller: function($scope) {
			$scope.handleSaveDublicatePropertiesButtonClick = function() {
				var concatenatedProperties = "";
				$scope.duplicateProperties.forEach(function(property) {
					if (property.selected) {
						concatenatedProperties += "," + property.key;
					}
				});
				concatenatedProperties = concatenatedProperties.substring(1);
				
				$scope.$emit("saveDuplicateProperties", concatenatedProperties);
			}
		}
	}
}]);