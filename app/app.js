var mainApp = angular.module('mainApp', ['ui.router', 'oc.lazyLoad']);

mainApp.constant('MyConfig', {
	SHOW_ERROR_MSG: false,
    TEMPLATE_CONFIG: {
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

mainApp.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider',
	function($locationProvider, $stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {
		$locationProvider.html5Mode(true);
		//$urlRouterProvider.otherwise('/landing.do');
		
		$ocLazyLoadProvider.config({
			debug: false,
			events: false,
			modules: [
				{
					name: 'lazy_autosize',
					files: [
						'app/libs/autosize/dist/autosize.js',
						'app/libs/angular-autosize.js'
					],
					serie: true
				}
			]
		});
		
		$stateProvider
			.state('prequal', {
				url: "/index.html",
				templateUrl: "templates/landing.html",
				controller: 'prequalController',
				resolve: {
					deps: ['$ocLazyLoad', function($ocLazyLoad) {
						return $ocLazyLoad.load([
							'app/prequalController.js'
						]);
					}]
				}
			})
			.state('increment', {
				url: "/index.html",
				templateUrl: "templates/increment.html",
				controller: 'incrementController',
				resolve: {
					deps: ['$ocLazyLoad', function($ocLazyLoad) {
						return $ocLazyLoad.load([
							'app/incrementController.js'
						]);
					}]
				}
			})
			/*.state('prequal', {
				url: "/index.html",
				templateUrl: "templates/thankyou.html",
				controller: 'tyController',
				resolve: {
					deps: ['$ocLazyLoad', function($ocLazyLoad) {
						return $ocLazyLoad.load([
							'app/tyController.js'
						]);
					}]
				}
			})*/
}]);

function init(json){
	mainApp.run(['RouterService', function(RouterService) {
		RouterService.navigate(json)
	}]);
}