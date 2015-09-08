(function() {
	if (!Array.prototype.map) {
		Array.prototype.map = function(callback, thisArg) {
			var T, A, k;
			if (this == null)
				throw new TypeError(" this is null or not defined")
			var O = Object(this);
			var len = O.length >>> 0;
			if (typeof callback !== "function")
				throw new TypeError(callback + " is not a function")
			if (thisArg)
				T = thisArg
			A = new Array(len);
			k = 0;
			while (k < len) {
				var kValue, mappedValue;
				if (k in O) {
					kValue = O[k];
					mappedValue = callback.call(T, kValue, k, O);
					A[k] = mappedValue;
				}
				k++;
			}
			return A;
		};
	}
}())

var mainApp = angular.module('mainApp', ['ngAnimate', 'ngRoute']);

// mainApp.config(function($routeProvider, $locationProvider) {
    // $locationProvider.hashPrefix('!');
    // $routeProvider.
		// when("/another",{
			// templateUrl: "/views/radio-in-table.html",
			// controller: "prequalController"
		// }).
		// when("/tags",{
			// templateUrl: "/views/radio-in-table.html",
			// controller: "prequalController"
		// }).
		// otherwise({redirectTo: "/index.html"});
	// $locationProvider.html5Mode(true);
// });