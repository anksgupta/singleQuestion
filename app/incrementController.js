mainApp.controller('incrementController', ['$scope', 'HttpService', function($scope, HttpService){
	HttpService.getData('postqual.json')
		.then(function(data){
			$scope.user = {};
			
			$scope.json = data;
			$scope.fields = data.form.fields;
			$scope.order = data.form.order;
			$scope.criteria = eval(data.form.cbq);
			
			angular.forEach($scope.fields, function(field){
				$scope.user[field.name] = {};
				if(field.value){
					$scope.user[field.name].value = field.value
				}
			});
			
			$scope.click = function(){
				var responsePromise = $http.post("/angularjs-examples/json-test-data.jsp", $scope.user, {});
			};
			
		}, function(data){
			
		});
}])