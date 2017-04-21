var mainApp = angular.module('mainApp', ['ui.router', 'oc.lazyLoad']);

mainApp.constant('MyConfig', {
	textTypes: ['phoneformat', 'text', 'tel', 'date'],
	CBQ_NOT_SHOWN: 'CBQ_NOT_SHOWN',
	/**
	 * Add template types against a particular route if needed. Templates common for all the routes can be mapped against the key 'common'. 
	 * fieldDirective is the site specifc directive for a particular element type.
	 * fieldSpecificDirective is a comma separated string containing the field -> directive mapping. Add this mapping if you want a particular directive to be applied to a particular field. e.g: Handle placeholder for phone fields.
	 * <elem_type>CommonDirective is a comma separated field specific directive mapping containing the common directives to be added to that particular element type.
	 */
	TEMPLATE_CONFIG: {
		prequal: {},
		increment: {},
		common: {
			'Select': {
				fieldDirective: 'select-field',
				SelectCommonDirective: 'common-select-dir'
			},
			'RadioInTable': {fieldDirective: 'radio-in-table'},
			'CustomSelect': {fieldDirective: 'custom-select'},
			'Text': {fieldDirective: 'generate-field-by-type'},
			'Checkbox': {fieldDirective: 'generate-field-by-type'},
			'ActualText': {fieldDirective: 'text-field'},
			'ActualCheckbox': {fieldDirective: 'checkbox-field'},
			'HomePhoneConsent': {fieldDirective: 'home-phone-consent'},
			'Date': {fieldDirective: 'date-field'},
			'PhoneFormat': {
				fieldDirective: 'phone-field',
				PhoneFormatCommonDirective: 'common-phone-dir',
				fieldSpecificDirective: {
					'HP,WP': 'test-dir',
					'WP': 'place-holder'
				}
			}
		}
	},
	xengineAttributeMap: { // A map which contains attribute mapping of xapi -> java
		'Age': ['Age'],
		'EducationLevel': ['EducationLevel'],
		'DegreeOfInterest': ['DegreeOfInterest', 'qsHybridHeaderFilterDegree'],
		'AreaOfInterest': ['AreaOfInterest', 'AreaOfInterestGroup', 'ProgramsOfInterestType', 'qsHybridHeaderFilterSubject'],
		'HighSchoolGradYear': ['HighSchoolGradYear'],
		'DegreeStartTimeframe': ['DegreeStartTimeframe'],
		'LicensedNurse': ['LicensedNurse'],
		'Military': ['Military'],
		'zip': ['PC', 'qsHybridHeaderFilterZip'],
		'country': ['country', 'CN'],
		'state': ['state', 'SP'],
		'city': ['city', 'CT'],
		'BestTimeToCall': ['BestTimeToCall'],
		'MilitaryBranch': ['MilitaryBranch'],
		'Citizenship': ['Citizenship'],
		'TeachingLicense': ['TeachingLicense'],
		'HaveBachelor': ['HaveBachelor'],
		'campusType': ['EducationType'],
		'leadSubmittedVendors': ['leadSubmittedVendors'],
		'skippedVendors': ['skippedVendors']
	}
});

mainApp.config(['$locationProvider', '$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider',
	function($locationProvider, $stateProvider, $urlRouterProvider, $ocLazyLoadProvider) {
		$locationProvider.html5Mode(true);
		
		// Removing this line throws the below error on page load:
		// Uncaught Error: [$rootScope:infdig] 10 $digest() iterations reached. Aborting! Watchers fired in the last 5 iterations: []
		$urlRouterProvider.otherwise('/landing.do');
		
		$stateProvider
			.state('prequal', {
				url: "/index.html",
				templateUrl: "templates/landing.html",
				controller: 'prequalController',
				resolve: {
					// The below function gets executed twice. Once from $state.go and secondly it gets called internally.
					deps: ['$ocLazyLoad', 'RouterService', function($ocLazyLoad, RouterService) {
						var data = RouterService.getRouteData(), dependencies = ['js/prequalController.js'];
						if(data.dependencies) {
							dependencies = dependencies.concat(data.dependencies.map(function(dependency){
								return ('js/' + dependency + '.js');
							}));
						}
						
						return $ocLazyLoad.load(dependencies).then(function(){
							console.log('success');
						},function(err){
							console.log(err.message);
						});
					}]
				}
			})
			.state('increment', {
				url: "/index.html",
				templateUrl: "templates/increment.html",
				controller: 'incrementController',
				resolve: {
					deps: ['$ocLazyLoad', 'RouterService', function($ocLazyLoad, RouterService) {
						var data = RouterService.getRouteData(), dependencies = ['js/incrementController.js'];
						if(data.dependencies) {
							dependencies = dependencies.concat(data.dependencies.map(function(dependency){
								return ('js/' + dependency + '.js');
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