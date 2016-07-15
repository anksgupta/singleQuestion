mainApp.factory("RouterService", ['$state', function($state){
	var routeData = {};
	return {
		/**
		*	phoneNumberCache is used for caching the phone numbers
		*	@params
		*	number: Phone no to be verified
		*	contactMe: Vendor specific attribute which if present means that the consent should be shown if phone no length > 8
		*	url: Server side method which will verify the phone no 
		*/
		getRouteData: function(){
			return routeData
		},
		navigate: function(json) {
			if(!angular.equals({}, json)){
				routeData = json;
				$state.go(json.page_name, {}, {location: 'replace'});
			}
		}
	}
}]);