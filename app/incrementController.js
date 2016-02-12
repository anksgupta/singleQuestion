mainApp.controller('incrementController', ['$scope', 'HttpService', 'CBQService', function($scope, HttpService, CBQService){
	HttpService.getData('postqual.json')
		.then(function(data){
			$scope.user = {};
			$scope.json = data;
			CBQService.setConfig({
				fields: data.form.fields,
				getUserData: getUserData
			});
			$scope.fields = CBQService.getFields();
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
			function getUserData(field){
				return $scope.user[field].value
			}
			
		}, function(data){
			
		});
}])