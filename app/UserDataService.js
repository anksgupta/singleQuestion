mainApp.factory("UserDataService", ['MyConfig', '$q', function(MyConfig, $q){
	// Common Validation service to handle commmon field validations
	var appData = {fields: {}, user: {}, hiddenFields: {}},
	self = {
		requiredFieldMsg: 'Required Field',
		init: function(data){
			angular.extend(appData, data)
		},
		getField: function(fieldName){
			if(appData.fields[fieldName]) {
				return appData.fields[fieldName]
			}
			return {}
		},
		getFields: function(){
			if(appData.fields) {
				return appData.fields
			}
			return {}
		},
		getIsRequired: function(fieldName){
			if(appData.user[fieldName]) {
				return appData.user[fieldName].required
			}
			return false
		},
		getUserData: function(field){
			var valueArr = [], fieldValue = appData.user[field] ? appData.user[field].value : this.getHiddenField(field);
			if(typeof fieldValue === 'object') {
				for(var key in fieldValue) {
					valueArr.push(fieldValue[key] ? fieldValue[key] : null)
				}
				return valueArr
			}
			valueArr.push(fieldValue ? fieldValue : null);
			return valueArr
		},
		getHiddenField: function(field){
			var valueArr = [], fieldValue = appData.hiddenFields[field] ? appData.hiddenFields[field].value : null;
			if(typeof fieldValue === 'object') {
				for(var key in fieldValue) {
					valueArr.push(fieldValue[key] ? fieldValue[key] : null)
				}
				return valueArr
			}
			valueArr.push(fieldValue);
			return valueArr
		},
		setRequiredFieldMsg: function(field){
			if(appData.user[field]) {
				appData.user[field].error_message = self.requiredFieldMsg
			}
			return self
		},
		clearRequiredFieldMsg: function(field){
			if(appData.user[field]) {
				appData.user[field].error_message = ''
			}
			return self
		},
		validateFields: function(){
			// Add a flag over here to check if required field has to be set or not.
			var deferred = $q.defer(), result = true;
			for(var field in appData.user) {
				self.clearRequiredFieldMsg(field);
				if(self.getIsVisible(field) && self.getFieldType(field) !== 'Hidden'
					&& self.getUserData(field).indexOf(null) > -1 && self.getIsRequired(field)) {
						self.setRequiredFieldMsg(field);
						result = false
				}
			}
			deferred.resolve(result);
			return deferred.promise
		},
		getFieldType: function(fieldName){
			return appData.fields[fieldName] ? appData.fields[fieldName].type : undefined
		},
		getIsCBQ: function(field){
			return appData.fields[field] ? appData.user[field].is_cbq : false
		},
		getIsVisible: function(field){
			return appData.fields[field] ? appData.user[field].visible : false
		},
		setIsVisible: function(field, value){
			if(appData.user[field]) {
				appData.user[field].visible = value
			}
			return self
		},
		/**
		*	Called before hiding a CBQ question
		*/
		setCbqNotShown: function(elem){
			// Store the previously selected value in prevValue which will be used to pre-populate the answer option in case the CBQ question shows up again
			var field = appData.user[elem];
			if(field) {
				// Don't override the actual value if the new value contains CBQ_NOT_SHOWN.
				if(field.value && JSON.stringify(field.value).indexOf(MyConfig.CBQ_NOT_SHOWN) === -1){
					field.prevValue = angular.copy(field.value);
				}
				// For fields having multiple properties e.g: MilitarySeparationyear, override all values with CBQ_NOT_SHOWN.
				if(typeof field.value === 'object') {
					for(var key in field.value) {
						field.value[key] = MyConfig.CBQ_NOT_SHOWN
					}
				} else {
					field.value = MyConfig.CBQ_NOT_SHOWN
				}
			}
			return self
		},
		/**
		*	Called before showing a CBQ question
		*/
		clearCbqNotShown: function(field){
			// Fetch the value user had previously selected iff it is stored in prevValue
			if(appData.user[field]) {
				if(typeof appData.user[field].prevValue !== 'undefined'){
					appData.user[field].value = angular.copy(appData.user[field].prevValue);
				}
			}
			return self
		},
		getCriteria: function(){
			if(appData.cbqCriteria)
				return appData.cbqCriteria
				
			return undefined
		},
		getFieldCriteria: function(fieldName){
			if(appData.cbqCriteria[fieldName])
				return appData.cbqCriteria[fieldName]
			
			return undefined
		},
		getFinalUserData: function(){
			var finalObj = {};
			for(var key in appData.user){
				if(self.getFieldType(key) !== 'Hidden') {
					// If value is an object & it contains CBQ_NOT_SHOWN, then send CBQ_NOT_SHOWN else send the actual value.
					finalObj[key] = (JSON.stringify(appData.user[key].value).indexOf(MyConfig.CBQ_NOT_SHOWN) !== -1) ?
										MyConfig.CBQ_NOT_SHOWN : appData.user[key].value
				}
			}
			return finalObj
		}
	};
	
	return self
}]);