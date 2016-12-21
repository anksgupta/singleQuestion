// Always get the module reference rather than using the existing app reference. If you use the existing app reference, then it gives an error if you try and load the controller using ocLazyLoad.
angular.module('mainApp').controller('prequalController', ['$scope', '$q', 'HttpService', 'InitializationService', 'RouterService', function($scope, $q, HttpService, InitializationService, RouterService){
	var data = RouterService.getRouteData();
	angular.extend($scope, InitializationService.initialize(data));
	
	$scope.singleQuestionOptions = {
		order: data.form.order,
		preConditions : {
			// Add all field validations & prerequisites before show next is called
			// SingleQuestion 2.2 'Go_Next' functionality inside showNext function can be implemented by resolving promise with 'false' value
			"WP": function(){
				var deferred = $q.defer();
				deferred.resolve(true);
				console.log('WP');
				return deferred.promise
			}
		},
		callbacks: {
			'before_next': function(){
				
			}
		}
	}
	
	// For rendering the fields based on order, we have to remove the nested arrays
	$scope.order = [].concat.apply([], data.form.order)
}])