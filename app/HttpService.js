mainApp.factory("HttpService", ['$http', '$q', function($http, $q){
	return {
		getData: function(url){
			var deferred = $q.defer();	//Creating a deferred object
			$http.get(url)
				.success(function(data) {
					deferred.resolve(data)	//Passing data to deferred's resolve function on successful completion
				})
				.error(function() {
                    deferred.reject("Error occured while fetching ajax response")	//Sending an error message in case of failure
                });
			return deferred.promise	//Returning the promise object
		}
	}
}]);