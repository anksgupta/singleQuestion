mainApp.factory("InitializationService", ['CBQService', '$q', function(CBQService, $q){
	var user = {}, fields = {}, cbqCriteria = {}, hiddenFieldsToRender = ['leadid_token'],
	self = {
		/**
		*	initialize method that creates user and fields object to render form
		*	@params
		*	json: json data that contains all page data
		*/
		requiredFieldMsg: 'Required Field',
		initialize: function(json) {
			// set cbq criteria
			cbqCriteria = eval(json.form.cbq)
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
						if(field.value){
							user[field.name].value = field.value
						}
				}
			}
			// Set CBQ service data
			CBQService.setCBQServiceData({
				fields: fields,
				cbq: cbqCriteria,
				getUserData: self.getUserData
			});
			
			return {
				user: user,
				fields: fields
			}
		},
		getField: function(fieldName){
			return fields[fieldName]
		},
		getIsRequired: function(fieldName){
			return user[fieldName].required
		},
		getUserData: function(field){
			var valueArr = [], fieldValue = user[field].value;
			if(typeof fieldValue === 'object') {
				for(var key in fieldValue) {
					valueArr.push(fieldValue[key] ? fieldValue[key] : null)
				}
				return valueArr
			}
			valueArr.push(fieldValue ? fieldValue : null);
			return valueArr
		},
		setRequiredFieldMsg: function(field){
			user[field].error_message = self.requiredFieldMsg;
			return self
		},
		clearRequiredFieldMsg: function(field){
			user[field].error_message = '';
			return self
		},
		validateFields: function(){
			var deferred = $q.defer(), result = true;
			for(var field in user) {
				self.clearRequiredFieldMsg(field);
				if(self.getUserData(field).indexOf(null) > -1 && self.getIsRequired(field)) {
					self.setRequiredFieldMsg(field);
					result = false
				}
			}
			deferred.resolve(result);
			return deferred.promise
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
			user[field].visible = value;
			return self
		},
		/**
		*	Called before hiding a CBQ question
		*/
		setCbqNotShown: function(field){
			// Store the previously selected value in prevValue which will be used to pre-populate the answer option in case the CBQ question shows up again
			if(user[field].value){
				user[field].prevValue = user[field].value;
			}
			user[field].value = 'CBQ_NOT_SHOWN';
			return self
		},
		/**
		*	Called before showing a CBQ question
		*/
		clearCbqNotShown: function(field){
			// Fetch the value user had previously selected iff it is stored in prevValue
			if(typeof user[field].prevValue !== 'undefined'){
				user[field].value = user[field].prevValue;
			}
		},
		getCriteria: function(){
			return cbqCriteria
		},
		getFinalUserData: function(){
			var finalObj = {};
			for(var key in user){
				finalObj[key] = user[key].value
			}
			return finalObj
		}
	}
	
	return self
}]);