mainApp.factory("TcpaService", ['$q', '$rootScope', 'HttpService', function($q, $rootScope,HttpService){
	var phoneNumberCache = {};
	return {
		/**
		*	handleTCPA verifies the phone number and broadcasts an event 'ShowPhoneConsent' which should be handled in order to display the consent
		*	phoneNumberCache is used for caching the phone numbers
		*	@params
		*	number: Phone no to be verified
		*	contactMe: Vendor specific attribute which if present means that the consent should be shown if phone no length > 8
		*	url: Server side method which will verify the phone no 
		*/
		handleTCPA: function(number, contactMe, url) {
			if(typeof phoneNumberCache[number] !== 'undefined'){
				$rootScope.$broadcast('ShowPhoneConsent', {showConsent: phoneNumberCache[number]});
			}else{
				// If contactMe is true and phone no length > 8, then display consent by default
				if(contactMe && number.length > 8) {
					$rootScope.$broadcast('ShowPhoneConsent', {showConsent: true});
				// If contactMe is false and phone no length = 10, then make an ajax call to verify the no
				} else if(number.length === 10) {
					HttpService.getData(url ? url : 'is-mobile.do').then(function(data){
						// Cache the phone number and broadcast the event
						phoneNumberCache[number] = data.response;
						$rootScope.$broadcast('ShowPhoneConsent', {showConsent: true});
					},function(error){
						// Cache the phone number and broadcast the event
						phoneNumberCache[number] = false;
						$rootScope.$broadcast('ShowPhoneConsent', {showConsent: false});
					});
				} else {
					$rootScope.$broadcast('ShowPhoneConsent', {showConsent: false});
				}
			}
		}
	}
}]);