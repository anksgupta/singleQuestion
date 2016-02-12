mainApp.filter('preseveHtml', function($sce){
	return function(val) {
		return $sce.trustAsHtml(val)
	}
});

mainApp.filter('shouldShow', function(){
	return function(options, is_cbq) {
		if(is_cbq){
			var filteredOptions = [];
			for(var i = 0; i < options.length; i++) {
				if(!options[i].hidden)
					filteredOptions.push(options[i]);
			}
			return filteredOptions;
		}else {
			return options
		}
	}
})