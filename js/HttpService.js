mainApp.factory("HttpService", ['$http', '$q', function($http, $q){
	/**
	*	
	*	callInProgress: flag which indicates that a call is in progress. Can be used to prevent form submission if a call is in progress.
	*/
	var self = {
		callInProgress: false,
		getData: function(url, postDataObj){
			self.callInProgress = true;
			var deferred = $q.defer();	//Creating a deferred object
			$http.post(url, postDataObj).then(function(data){
				self.callInProgress = false;
				deferred.resolve(data)	//Passing data to deferred's resolve function on successful completion
			}, function(data){
				self.callInProgress = false;
				deferred.reject({16750611: false, 16750612: false, 82612360: false})	//Sending an error message in case of failure
			})
			return deferred.promise	//Returning the promise object
		},
		getJSONPData: function(url, postDataObj){
			self.callInProgress = true;
			var deferred = $q.defer();	//Creating a deferred object
			url += ((url.indexOf('?') > -1) ? '&' : '?') + 'callback=JSON_CALLBACK';
			$http.jsonp(url, postDataObj).then(function(data) {
				self.callInProgress = false;
				deferred.resolve(data)	//Passing data to deferred's resolve function on successful completion
			}, function() {
				self.callInProgress = false;
				deferred.reject({16750611: false, 16750612: false, 82612360: false})	//Sending an error message in case of failure
			});
			return deferred.promise
		}
	}
	return self
}]);