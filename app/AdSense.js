// An error was thrown saying unknown provider -> AdSenseProvider. It wasn't reproducible afterwards. Just to be safe, we are again getting the reference of mainApp before defining the factory.
angular.module('mainApp').factory("AdSense", ['$q', function($q){
	var self = {
		init: function() {
		
		},
		validate: function() {
			var deferred = $q.defer();
			deferred.resolve(true);
			return deferred.promise
		}
	};
	
	self.init();
	return self
}]);