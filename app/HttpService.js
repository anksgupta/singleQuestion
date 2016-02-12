mainApp.factory("HttpService", ['$http', '$q', function($http, $q){
	return {
		getData: function(url, postDataObj){
			var deferred = $q.defer();	//Creating a deferred object
			$http.post(url, postDataObj)
				.success(function(data) {
					deferred.resolve(data)	//Passing data to deferred's resolve function on successful completion
				})
				.error(function() {
                    deferred.reject({16750611: true, 16750612: true})	//Sending an error message in case of failure
                });
			return deferred.promise	//Returning the promise object
		}
	}
}]);