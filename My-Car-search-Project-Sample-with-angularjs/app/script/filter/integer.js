"use strict";

angular.module('cardetectiveApp').filter('integer', function() {
    return function(input) {
		return parseInt(input);
    }
});