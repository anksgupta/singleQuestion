mainApp.factory("InitializationService", ['CBQService', function(CBQService){
	var user = {}, fields = {};
	return {
		/**
		*	handleTCPA verifies the phone number and broadcasts an event 'ShowPhoneConsent' which should be handled in order to display the consent
		*	phoneNumberCache is used for caching the phone numbers
		*	@params
		*	number: Phone no to be verified
		*	contactMe: Vendor specific attribute which if present means that the consent should be shown if phone no length > 8
		*	url: Server side method which will verify the phone no 
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
								is_cbq: field.is_cbq
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