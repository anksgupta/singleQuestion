mainApp.factory("CommonValidationService", ['$q', 'UserDataService', 'HttpService', function($q, UserDataService, HttpService){
	// Common Validation service to handle commmon field validations
	var validations = {
			fieldValidation: {
				"Age": function(){
					var deferred = $q.defer(), val = UserDataService.getUserData('Age');
					val = (val.indexOf(null) > -1) ? '' : val.join('').toString();
					UserDataService[((val.length === 2) ? 'clear' : 'set') + 'RequiredFieldMsg']('Age');
					deferred.resolve((val.length === 2) ? true : false);
					return deferred.promise;
				},
				"HighSchoolGradYear": function(){
					var deferred = $q.defer(), val = UserDataService.getUserData('HighSchoolGradYear');
					val = (val.indexOf(null) > -1) ? '' : val.join('').toString();
					UserDataService[((val.length === 4) ? 'clear' : 'set') + 'RequiredFieldMsg']('HighSchoolGradYear');
					deferred.resolve((val.length === 4) ? true : false);
					return deferred.promise;
				}
			},
			stepvalidation: function(stepArr){
				var stepDeferred = $q.defer(), validationObj = {
					'S1,EM,PC': function(){
						var deferred = $q.defer();
						HttpService.getData('/addressValidator', 'S1=test').then(function(json){
							deferred.resolve(true);
						}, function(json){
							deferred.resolve(true);
						})
						return deferred.promise;
					},
					'FN': function(){
						var deferred = $q.defer();
						deferred.resolve(true);
						return deferred.promise;
					}
				};
				
				for(var i = 0, stepValidationToBeDone = false; i < stepArr.length; i++) {
					for(var key in validationObj){
						if(key.indexOf(stepArr[i]) > -1) {
							stepValidationToBeDone = true;
							break;
						}
					}
					if(stepValidationToBeDone)
						break
				}
				
				if(stepValidationToBeDone){
					validationObj[key]().then(function(data){
						stepDeferred.resolve(data);
					});
				} else {
					stepDeferred.resolve(true);
				}
				
				return stepDeferred.promise;
			}
		};
		
	return validations
}]);