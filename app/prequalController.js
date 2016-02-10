mainApp.controller('prequalController', ['$scope', '$q', 'HttpService', 'SingleQuestion', '$rootScope', function($scope, $q, HttpService, SingleQuestion, $rootScope){
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
				"Age": function(){
					var deferred = $q.defer();
					HttpService.getData('addressValidator.on').then(function(){
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
			}
			
			for(var key in $scope.fields){
				var field = $scope.fields[key];
				$scope.user[field.name] = {};
				if(field.value){
					$scope.user[field.name].value = field.value;
				}
			}
			
			$scope.submit = function(callback){
				if(typeof callback === 'function')
					callback()
				var responsePromise = HttpService.getData("/angularjs-examples/json-test-data.jsp", $scope.user);
			};
			
		}, function(data){
			
		})
}])