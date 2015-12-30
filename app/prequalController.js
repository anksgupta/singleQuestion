mainApp.controller('prequalController', ['$scope', 'HttpService', 'SingleQuestion', '$rootScope', function($scope, HttpService, SingleQuestion, $rootScope){
	HttpService.getData('data.json')
		.then(function(data){
			$scope.user = {};
			
			$scope.dataLoaded = true;
			
			$scope.json = data;
			$scope.form = $scope.json.form
			$scope.order = $scope.form.order;
			$scope.fields = $scope.form.fields;
			
			// Add all field validations for single question flow
			$scope.fieldValidations = {
				"Age": function(value){
					return ((value.toString().length === 2) ?  true :  false)
				},
				"HighSchoolGradYear" : function(value){
					return ((value.toString().length === 4) ?  true :  false)
				}
			}
			
			angular.forEach($scope.fields, function(field){
				$scope.user[field.name] = {};
				if(field.value){
					$scope.user[field.name].value = field.value;
				}
			});
			
			$scope.click = function(){
				var responsePromise = $http.post("/angularjs-examples/json-test-data.jsp", $scope.user, {});
			};
			
		}, function(data){
			
		})
}])