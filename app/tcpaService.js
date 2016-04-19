mainApp.factory("TcpaService", ['$q', '$rootScope', 'HttpService', function($q, $rootScope,HttpService){
	return {
		handleTCPA: function(number, contactMe) {
			console.log("number: " + number + ", contactMe: " + contactMe)
			if(contactMe && number.length > 8) {
				$rootScope.$broadcast('ShowPhoneConsent', {showConsent: true});
			} else if(number.length === 10) {
				HttpService.getData('is-mobile.do').then(function(data){
					$rootScope.$broadcast('ShowPhoneConsent', {showConsent: true});
				},function(error){
					console.log(error);
					$rootScope.$broadcast('ShowPhoneConsent', {showConsent: false});
				});
			} else {
				$rootScope.$broadcast('ShowPhoneConsent', {showConsent: false});
			}
		}
	}
}]);