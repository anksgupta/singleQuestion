mainApp.factory("NotificationService", ['$rootScope', function($rootScope){
	/**
	 *	This service contains APIs to notify user once subscribed event is completed
	 */
	var subscriberMap = {};
	return {
		/** Method to subscribe to event and execute callback. Once callback is executed notify event completion
		 *	@params
		 *	event: eventName to subscribe
		 *	callback: callback function that will be executed once event is broadcast/emit
		 */
		subscribe: function(event, callback){
			$rootScope.$on(event, callback);
			(angular.isArray(subscriberMap[event]) ? subscriberMap[event].push(false) : (subscriberMap[event] = [false]));
			console.log('subscribe: ' + event);
		},
		/** Method to notify event completion and update subscriberMap
		 *	@params
		 *	event: name of event to notify
		 */
		notify: function(event){
			if(subscriberMap[event]){
				// set notified event value to 'true' in subsciberMap
				if(subscriberMap[event].indexOf(false) > -1) {
					subscriberMap[event][subscriberMap[event].indexOf(false)] = true;
					console.log('notify: ' + event);
				}
				// if event all subscriptions are notified delete the event from subscriberMap and emit eventNotified event
				if(subscriberMap[event].indexOf(false) === -1) {
					delete subscriberMap[event];
					$rootScope.$emit('eventNotified', {notifiedEvent: event});
				}
			}
			return false;
		}
	}
}]);