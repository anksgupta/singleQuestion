mainApp.factory("TcpaService", ['$q', '$rootScope', 'HttpService', function($q, $rootScope,HttpService){
	var phoneNumberCache = {}, 
		defaultTcpaOptions = {contactMe: false, url: 'is-mobile.do'},
		
		// Do we really need phoneMap?????????????
		
		phoneMap = {'HP': false,'WP': false},
		broadcastConsent = function(fieldName, isNumber, deferred){
			phoneMap[fieldName] = isNumber;
			$rootScope.$broadcast('ShowPhoneConsent', {showConsent: (phoneMap.HP || phoneMap.WP)});
			deferred.resolve(true);
		};
	return {
		/**
		*	handleTCPA verifies the phone number and broadcasts an event 'ShowPhoneConsent' which should be handled in order to display the consent
		*	phoneNumberCache is used for caching the phone numbers
		*	@params
		*	number: Phone no to be verified
		*	contactMe: Vendor specific attribute which if present means that the consent should be shown if phone no length > 8
		*	url: Server side method which will verify the phone no 
		*/
		handleTCPA: function(phoneFieldOptions) {
			var tcpaOptions = angular.extend({}, defaultTcpaOptions, phoneFieldOptions), deferred = $q.defer();
			if(typeof phoneNumberCache[tcpaOptions.number] !== 'undefined'){
				broadcastConsent(tcpaOptions.fieldName, phoneNumberCache[tcpaOptions.number], deferred);
			}else {
				// If contactMe is true and phone no length > 8, then display consent by default
				if(tcpaOptions.contactMe && tcpaOptions.number.length > 8) {
					broadcastConsent(tcpaOptions.fieldName, true, deferred);
				// If contactMe is false and phone no length = 10, then make an ajax call to verify the no
				} else if(tcpaOptions.number.length === 10) {
					HttpService.getData(tcpaOptions.url).then(function(data){
						// Cache the phone number and broadcast the event
						phoneNumberCache[tcpaOptions.number] = data.response;
						broadcastConsent(tcpaOptions.fieldName, data.response, deferred);
					},function(error){
						// Cache the phone number and broadcast the event
						phoneNumberCache[tcpaOptions.number] = false;
						broadcastConsent(tcpaOptions.fieldName, false, deferred);
					});
				} else {
					broadcastConsent(tcpaOptions.fieldName, false, deferred);
				}
			}
			return deferred.promise;
		}
	}
}]);