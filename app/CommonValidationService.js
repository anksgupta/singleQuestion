mainApp.factory("CommonValidationService", ['$q', 'UserDataService', function($q, UserDataService){
	// Common Validation service to handle commmon field validations
	 var self = {
		"Age": function(){
			var deferred = $q.defer(), val = UserDataService.getUserData('Age');
			val = (val.indexOf(null) > -1) ? '' : val.join('').toString();
			((val.length === 2) ?  deferred.resolve(true) :  deferred.resolve(false));
			return deferred.promise;
		},
		"HighSchoolGradYear": function(){
			var deferred = $q.defer(), val = UserDataService.getUserData('HighSchoolGradYear');
			val = (val.indexOf(null) > -1) ? '' : val.join('').toString();
			((val.length === 4) ?  deferred.resolve(true) :  deferred.resolve(false));
			return deferred.promise;
		}
	}
	return self
}]);