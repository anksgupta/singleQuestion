mainApp.controller('incrementController', ['$scope', 'HttpService', 'CBQService', function($scope, HttpService, CBQService){
	HttpService.getData('postqual.json')
		.then(function(data){
			$scope.order = [].concat.apply([], data.form.order);
		
			$scope.user = {};
			$scope.fields = {};
			
			// Set prepopulated field values in User object
			for(var key in data.form.fields){
				var field = data.form.fields[key];
				switch(field.type){
					case 'Hidden': case 'Submit':
						break
					default:
						$scope.fields[field.name] = field;
						switch(field.name){
							case 'HP': case 'WP':
								for(var phoneField in field.value){
									$scope.user[phoneField] = {};
									if(field.value[phoneField]){
										$scope.user[phoneField].value = field.value[phoneField]
									}
								}
								break
							default:
								$scope.user[field.name] = {};
								if(field.value){
									$scope.user[field.name].value = field.value
								}
						}
				}
			}
			
			$scope.dataLoaded = true;
			
			// Set CBQ service data
			CBQService.setCBQServiceData({
				fields: $scope.fields,
				getUserData: getUserData
			});
			
			$scope.criteria = eval(data.form.cbq);
			
			function getUserData(field){
				return $scope.user[field].value
			}
			
			$scope.click = function(){
				var responsePromise = HttpService.getData("/angularjs-examples/json-test-data.jsp", $scope.user);
				return responsePromise;
			}
			
		}, function(data){
			
		});
}])