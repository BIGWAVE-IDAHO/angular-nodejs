"use strict";

angular.module('cardetectiveApp')
.directive('overallStatistics', [
	'PublishSubscribeChannel',
	function (
	PublishSubscribeChannel) {

	return {
		restrict: 'A',

		controller: function($scope) {
			var lastFilteredVehicles = null;

			var calculateStatistics = function(vehicles) {
				$scope.statistics.minimalAdPrice = null;
				$scope.statistics.maximalAdPrice = null;
				$scope.statistics.accumulatedAdPrice = 0;
				$scope.statistics.accumulatedAdMileage = 0;
				$scope.statistics.accumulatedAdLife = 0;

				$scope.statistics.vehiclesCount = vehicles.length;

				vehicles.forEach(function(vehicle) {
					if (vehicle.deleted) {
						return;
					}
					$scope.statistics.minimalAdPrice = $scope.statistics.minimalAdPrice ? Math.min($scope.statistics.minimalAdPrice, vehicle.price) : vehicle.price;
					$scope.statistics.maximalAdPrice = $scope.statistics.maximalAdPrice ? Math.max($scope.statistics.maximalAdPrice, vehicle.price) : vehicle.price;
					$scope.statistics.accumulatedAdPrice += vehicle.price ? parseFloat(vehicle.price) : 0;
					$scope.statistics.accumulatedAdMileage += vehicle.mileage ? parseFloat(vehicle.mileage) : 0;
					$scope.statistics.accumulatedAdLife += vehicle.adLife ? vehicle.adLife : 0;

					vehicle.statistics = $scope.statistics;
				});
			}

			$scope.$on("resultsFiltered", function(event, filteredVehicles) {
				lastFilteredVehicles = filteredVehicles;
				calculateStatistics(lastFilteredVehicles);
			});

			PublishSubscribeChannel.subscribe("deleted-car-from-result-list", function(ad) {
				if (lastFilteredVehicles) {
					calculateStatistics(lastFilteredVehicles);
				}
			});
		}
	}
}]);