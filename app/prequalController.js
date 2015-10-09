mainApp.controller('prequalController', ['$scope', 'HttpService', 'SingleQuestion', '$rootScope', function($scope, HttpService, SingleQuestion, $rootScope){
	HttpService.getData('data.json')
		.then(function(data){
			$scope.user = {};
			
			$scope.dataLoaded = true;
			
			$scope.json = data;
			$scope.form = $scope.json.form
			$scope.order = $scope.form.order;
			$scope.fields = $scope.form.fields;
			
			angular.forEach($scope.fields, function(field){
				$scope.user[field.name] = {};
				if(field.value){
					$scope.user[field.name].value = field.value
				}
			});
			
			// $scope.$on('progressBarWidthUpdated', function(){
				// $scope.progressBarWidth = SingleQuestion.progressBarWidth
			// });
			
			// $scope.$on('currentUpdated', function(){
				// $scope.current = SingleQuestion.current
			// });
			
			// $scope.SingleQuestion = SingleQuestion.init({
				// order: $scope.order,
				// cbq: eval($scope.form.cbq),
				// callback: {
					// 'before_next': function(){
						
					// },
					// 'getUserData': function(field){
						// return $scope.user[field].value
					// },
					// 'isCBQ': function(field){
						// var obj = {};
						// if(angular.isArray(field)){
							// angular.forEach(field, function(elem){
								// obj[elem] = {'is_cbq': $scope.fields[elem]['is_cbq']}
							// });
						// }else{
							// obj[field] = {'is_cbq': $scope.fields[field]['is_cbq']}
						// }
						// return obj // return value will be something like [['Age', true], ['DSTF', false]] or [['DSTF', false]]
					// }
				// }
			// });
			
			// angular.forEach($scope.SingleQuestion.order, function(field){
				// $scope.$watchCollection(function(){return $scope.user[field]}, function(newValue, oldValue) {
					// if(newValue !== oldValue){
						// $scope.SingleQuestion.showNext()
					// }
				// });
			// });
			
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
		}, function(data){
			
		})
}])