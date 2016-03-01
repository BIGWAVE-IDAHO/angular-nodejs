"use strict";

angular.module('cardetectiveApp')
.factory('ArrayUtil', 
[
function (
) {
	return {
		arrayFrom: function(object) {
			var result = [];
				for (var key in object) {
					result.push(_.cloneDeep(object[key]));
				}

				return result;
		}
	}

}]);