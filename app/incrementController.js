mainApp.controller('incrementController', ['$scope', '$http', function($scope, $http){
	$http.get('postqual.json').success(function(data) {
		$scope.json = data;
		$scope.fields = data.form.fields;
		$scope.order = data.form.order;
		$scope.cbq = eval(data.form.cbq);
		
		angular.forEach($scope.json.form.fields, function(field){
			$scope.user[field.name] = field.value || ''
		})
		
	});
	$scope.user = {};
	
	$scope.click = function(){
		var responsePromise = $http.post("/angularjs-examples/json-test-data.jsp", $scope.user, {});
	};
}])