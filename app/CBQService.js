mainApp.factory("CBQService", ['$http', '$q', function($http, $q){
	var url = '/CBQValidator.jsp';
	return {
		handleCBQ: function(postDataObj){
			var deferred = $q.defer();
			$http.post(url, postDataObj)
				.success(function(data) {
					deferred.resolve(data)
				})
				.error(function() {
                    deferred.reject(true)
                });
			return deferred.promise
		}
	}
}]);