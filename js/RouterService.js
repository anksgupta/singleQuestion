mainApp.factory("RouterService", ['$state', '$rootScope', function($state, $rootScope){
	var routeData = {};
	return {
		/**
		*	
		*	@params
		*	
		*/
		getRouteData: function(){
			return routeData
		},
		navigate: function(json) {
			if(!angular.equals({}, json)){
				var page_name = routeData.page_name;
				routeData = json;
				// Check if the new json and the current json page_name are the same(this might happen if there is an error in any of the submitted form fields). If yes, then emit an event that can be subscribed to handle such cases.
				if(page_name === json.page_name) {
					$rootScope.$emit('handleRedirectionToTheSamePage')
				} else {
					$state.go(json.page_name, {}, {location: 'replace'});
				}
			}
		}
	}
}]);