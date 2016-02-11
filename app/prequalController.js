mainApp.controller('prequalController', ['$scope', '$q', 'HttpService', 'SingleQuestion', '$rootScope', function($scope, $q, HttpService, SingleQuestion, $rootScope){
	HttpService.getData('data.json')
		.then(function(data){
			$scope.user = {};
			$scope.json = data;
			var form = $scope.json.form;
			$scope.fields = form.fields;
			$scope.dataLoaded = true;
			
			// Set prepopulated field values in User object
			for(var key in $scope.fields){
				var field = $scope.fields[key];
				$scope.user[field.name] = {};
				if(field.value){
					$scope.user[field.name].value = field.value;
				}
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
					'getUserData': function(field){
						return $scope.user[field].value
					},
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