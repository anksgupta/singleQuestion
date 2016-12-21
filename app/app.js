var mainApp = angular.module('mainApp', ['ui.router', 'oc.lazyLoad']);

mainApp.constant('MyConfig', {
	SHOW_ERROR_MSG: false,
	CBQ_NOT_SHOWN: 'CBQ_NOT_SHOWN',
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
		
		$stateProvider
			.state('prequal', {
				url: "/index.html",
				templateUrl: "templates/landing.html",
				controller: 'prequalController',
				resolve: {
					// The below function gets executed twice. Once from $state.go and secondly it gets called internally.
					deps: ['$ocLazyLoad', 'RouterService', function($ocLazyLoad, RouterService) {
						var data = RouterService.getRouteData(), dependencies = ['app/prequalController.js'];
						if(data.dependencies) {
							dependencies = dependencies.concat(data.dependencies.map(function(dependency){
								return ('app/' + dependency + '.js');
							}));
						}
						
						return $ocLazyLoad.load(dependencies)
					}]
				}
			})
			.state('increment', {
				url: "/index.html",
				templateUrl: "templates/increment.html",
				controller: 'incrementController',
				resolve: {
					deps: ['$ocLazyLoad', 'RouterService', function($ocLazyLoad, RouterService) {
						var data = RouterService.getRouteData(), dependencies = ['app/incrementController.js'];
						if(data.dependencies) {
							dependencies = dependencies.concat(data.dependencies.map(function(dependency){
								return ('app/' + dependency + '.js');
							}));
						}
						
						return $ocLazyLoad.load(dependencies)
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