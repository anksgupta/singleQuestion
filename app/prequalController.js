mainApp.controller('prequalController', ['$scope', '$q', 'HttpService', 'SingleQuestion', 'InitializationService', 'RouterService', function($scope, $q, HttpService, SingleQuestion, InitializationService, RouterService){
	var data = RouterService.getRouteData();
	angular.extend($scope, InitializationService.initialize(data));
	
	$scope.singleQuestionOptions = {
		order: data.form.order,
		fieldValidations : {
		// Add all field validations for single question flow
			"Age": function(){
				var deferred = $q.defer();
				HttpService.getData('/addressValidator.do').then(function(){
					(($scope.user["Age"].value.toString().length === 2) ?  deferred.resolve(true) :  deferred.resolve(false));
				},function(){
					(($scope.user["Age"].value.toString().length === 2) ?  deferred.resolve(true) :  deferred.resolve(false));
				})
				return deferred.promise;
			},
			"HighSchoolGradYear" : function(){
				var deferred = $q.defer();
				(($scope.user["HighSchoolGradYear"].value.toString().length === 4) ?  deferred.resolve(true) :  deferred.resolve(false));
				return deferred.promise;
			}
		},
		callbacks: {
			'before_next': function(){
				
			},
			'submit': function(callback){
				var responsePromise = HttpService.getData("/angularjs-examples/json-test-data.jsp", $scope.user);
				return responsePromise;
			}
		}
	}
	
	$scope.$on('innerContentLoaded', function(args) {
		$scope.dataLoaded = true;
	});
	
	// For rendering the fields based on order, we have to remove the nested arrays
	$scope.order = [].concat.apply([], data.form.order)
}])