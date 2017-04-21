mainApp.factory("InitializationService", ['CBQService', 'UserDataService', function(CBQService, UserDataService){
	var self = {
		/**
		*	initialize method that creates user and fields object to render form
		*	@params
		*	json: json data that contains all page data
		*/
		initialize: function(json) {
			var user = {}, fields = {}, hiddenFields = {},
				hiddenFieldsToRender = ['leadid_token']
			// Prepopulate field values in User object
			for(var key in json.form.fields){
				var field = json.form.fields[key];
				switch(field.type){
					case 'Hidden': case 'Submit':
						if(hiddenFieldsToRender.indexOf(field.name) > -1){
							fields[field.name] = field;
							user[field.name] = {
									value: field.value
								};
						} else {
							// add session data in hiddenFields object
							hiddenFields[field.name] = {
									value: field.value
								};
						}
						break
					default:
						fields[field.name] = field;
						user[field.name] = {
								visible: true,
								required: field.is_required,
								is_cbq: field.is_cbq,
								error_message: field.error_message
							};
						
						user[field.name].value = field.value ? field.value : '';
				}
			}
			
			UserDataService.init({
				user: user,
				fields: fields,
				hiddenFields: hiddenFields,
				cbqCriteria: (typeof json.form !== 'undefined' && json.form.cbq) ? eval(json.form.cbq) : undefined //send cbq criteria
			});
			
			// Set CBQ service data
			CBQService.init();
			
			return {
				user: user,
				fields: fields
			}
		}
	};
	
	return self
}]);