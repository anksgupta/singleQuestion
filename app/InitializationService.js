mainApp.factory("InitializationService", ['CBQService', function(CBQService){
	var user = {}, fields = {};
	return {
		/**
		*	initialize method that creates user and fields object to render form
		*	@params
		*	json: json data that contains all page data
		*/
		initialize: function(json) {
			// Prepopulate field values in User object
			for(var key in json.form.fields){
				var field = json.form.fields[key];
				switch(field.type){
					case 'Hidden': case 'Submit':
						break
					default:
						fields[field.name] = field;
						user[field.name] = {
								visible: false,
								required: field.is_required,
								is_cbq: field.is_cbq,
								error_message: field.error_message
							};
						if(field.value){
							user[field.name].value = field.value
						}
				}
			}
			
			// Set CBQ service data
			CBQService.setCBQServiceData({
				fields: fields,
				cbq: eval(json.form.cbq),
				getUserData: this.getUserData
			});
			
			return {
				user: user,
				fields: fields
			}
		},
		getField: function(fieldName){
			return fields[fieldName]
		},
		getUserData: function(field){
			return user[field].value
		},
		getFieldType: function(fieldName){
			return fields[fieldName].type
		},
		getIsCBQ: function(field){
			return user[field].is_cbq
		},
		getIsVisible: function(field){
			return user[field].visible
		},
		setIsVisible: function(field, value){
			return user[field].visible = value
		}
	}
}]);