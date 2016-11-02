mainApp.factory("TrackingService", ['InitializationService', function(InitializationService){
	var prefix = 'DCSext.qse_edu_', wtAvailable = (typeof window.Webtrends === 'object' && typeof window.Webtrends.multiTrack === 'function');
	return {
		/**
		*	@params
		*	json: json data that contains all page data
		*/
		log: function(props, custom_prefix) {
			var arr = [];
			if(!props) {
				throw new Error('cannot make an empty WT ping');
			}
			if(!custom_prefix) {
				custom_prefix = prefix;
			}
			if(angular.equals({}, props)) {
				props = {
					eventType: props
				}
			}
			for(var key in props){
				arr.push(custom_prefix + key, props[key])
			}
			if(wtAvailable) {
				//setTimeout(function() {
					window.Webtrends.multiTrack({
						argsa: arr
					});
				//}, 20);
			}
			console.log("Edu.WT.log", arr, wtAvailable);
		}
	}
}]);