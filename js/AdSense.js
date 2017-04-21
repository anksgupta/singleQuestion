// An error was thrown saying unknown provider -> AdSenseProvider. It wasn't reproducible afterwards. Just to be safe, we are again getting the reference of mainApp before defining the factory.
angular.module('mainApp').factory("AdSense", ['$q', 'SingleQuestion', 'NotificationService', function($q, SingleQuestion, NotificationService){
	var self = {
		init: function() {
			
			NotificationService.subscribe('watchUserObj', function(event, args){
				var singlequestion_old_after_next = SingleQuestion.callbacks.after_next;
				SingleQuestion.callbacks.after_next = function() {
					if(typeof singlequestion_old_after_next === 'function') {
						singlequestion_old_after_next.call(this)
					}
					// Add logic to hide/show the Adsense button.
				};
				NotificationService.notify('watchUserObj')
			})
		},
		validate: function() {
			var deferred = $q.defer();
			/* 1. Resolve 'step-validate' in case there is no need to execute Adsense logic.
			 * 2. Resolve false in case Adsense logic evaluates to true and we show the Adsense button and stop at the current step.
			 * 3. Resolve true in case Adsense logic evaluates to false and we hide the Adsense button and move to the next step.
			*/
			deferred.resolve(true);
			return deferred.promise
		}
	};
	
	self.init();
	return self
}]);