mainApp.controller('prequalController', ['$scope', '$http', 'SingleQuestion', function($scope, $http, SingleQuestion){
	$http.get('data.json').success(function(data) {
		$scope.json = data;
		$scope.current = 0;
		$scope.order = data.form.order;
		
		angular.forEach($scope.json.form.fields, function(field){
			$scope.user[field.name] = {};
			if(field.value){
				$scope.user[field.name].value = field.value
			}
		});
		
		$scope.$on('progressBarWidthUpdated', function(){
			$scope.progressBarWidth = SingleQuestion.progressBarWidth
		});
		
		$scope.$on('currentUpdated', function(){
			$scope.current = SingleQuestion.current
		});
		
		SingleQuestion.user = $scope.user;
		
		$scope.SingleQuestion = SingleQuestion.init({
			order: $scope.order
		});
		
		angular.forEach($scope.SingleQuestion.order, function(field){
			$scope.$watchCollection(function(){return $scope.user[field]}, function(newValue, oldValue) {
				if(newValue !== oldValue){
					$scope.SingleQuestion.showNext()
				}
			});
		});
		
	});
	
	$scope.user = {};
	
	$scope.click = function(){
		var responsePromise = $http.post("/angularjs-examples/json-test-data.jsp", $scope.user, {});
	};
	
	$scope.handleAge = function(value){
		if(value.length >= 2)
			$scope.SingleQuestion.showNext()
	};
	
	$scope.handleHSGY = function(value){
		if(value.length >= 4)
			$scope.SingleQuestion.showNext()
	};
}])