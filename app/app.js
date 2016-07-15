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

var mainApp = angular.module('mainApp', ['ui.router']);

mainApp.constant('myConfig', {
    templateConfig: {
		'Select': 'select-field',
		'RadioInTable': 'radio-in-table',
		'CustomSelect': 'custom-select',
		'Text': 'generate-field-by-type',
		'Checkbox': 'generate-field-by-type',
		'ActualText': 'text-field',
		'ActualCheckbox': 'checkbox-field',
		'HomePhoneConsent': 'home-phone-consent',
		'PhoneFormat': 'phone-field'
	}
});

mainApp.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', function($locationProvider, $stateProvider, $urlRouterProvider) {
	$locationProvider.html5Mode(true);
	//$urlRouterProvider.otherwise('/landing.do');
	$stateProvider
		.state('prequal', {
			url: "/index.html",
			templateUrl: "templates/landing.html",
			controller: 'prequalController'
		})
		.state('increment', {
			url: "/increment.do",
			templateUrl: "templates/increment.html",
			controller: 'incrementController'
		})
}]);

function init(json){
	mainApp.run(['RouterService', function(RouterService) {
		RouterService.navigate(json)
	}]);
}