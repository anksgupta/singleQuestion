mainApp.controller('prequalController', ['$scope', '$q', '$rootScope', 'HttpService', 'SingleQuestion', 'CBQService', function($scope, $q, $rootScope, HttpService, SingleQuestion, CBQService){
	HttpService.getData('data.json')
		.then(function(data){
			$scope.order = [].concat.apply([], data.form.order);
		
			$scope.user = {};
			$scope.fields = {};
			var form = data.form;
			
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
			
			// Set CBQ service data
			CBQService.setCBQServiceData({
				fields: $scope.fields,
				getUserData: getUserData
			});
			
			$scope.dataLoaded = true;
			
			function getUserData(field){
				return $scope.user[field].value
			}
			
			$scope.singleQuestionOptions = {
				user: $scope.user,
				fields: form.fields,
				order: form.order,
				cbq: eval(form.cbq),
				fieldValidations : {
				// Add all field validations for single question flow
					"Age": function(){
						var deferred = $q.defer();
						HttpService.getData('/addressValidator.on').then(function(){
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
					'getUserData': getUserData,
					'isCBQ': function(step){
						var obj = {};
						for(var i=0; i < step.length; i++){
							obj[step[i]] = {'is_cbq': $scope.fields[step[i]]['is_cbq']}
						}
						return obj // return value will be something like {'Age': {'is_cbq': true}}
					},
					'submit': function(callback){
						var responsePromise = HttpService.getData("/angularjs-examples/json-test-data.jsp", $scope.user);
						return responsePromise;
					}
				}
			}
			
		}, function(data){
			
		})
}])