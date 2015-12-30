mainApp.factory("SingleQuestion", ['$rootScope', 'CBQService', '$q', '$timeout', function($rootScope, CBQService, $q, $timeout){
	var defaults = {
        callback: {},
        current: 0,
        steps: 0,
		cbq: {},
		CBQObj: {},
		fieldValidations: {},
        history_back: false
	};
	return {
		init: function(options){
			angular.extend(this, defaults, options);
			self = this,
			this.current = 0, 
			this.steps = this.order.length,
			this.CBQObj = this.getCBQObj();	// create CBQObj on init, object is used to verify if field is CBQ type
			
			if(typeof this.callback['before_load'] === 'function')
				this.callback['before_load'].call(this)
			
			// set current property of SingleQuestion object
			this.setCurrentValue(this.current, function(){
				// callback function- to broadcast 'currentUpdated' event once steps are validated and 'current' is updated
				$rootScope.$broadcast('currentUpdated');
				self.setProgressBarWidth();
				
				if(typeof self.callback['after_load'] === 'function')
					self.callback['after_load'].call(self)
			});
			
			return this
		},
		isValidField: function(fieldName){	// method to validate individual field, fieldName is passed as parameter
			var result = true;
			if(!this.getUserData(fieldName) || 
				(this.fieldValidations[fieldName] && !this.fieldValidations[fieldName](this.getUserData(fieldName)))) {	
				// check if field value is empty/blank OR if validation condition exists AND field is NOT Valid
				if(this.CBQObj[fieldName] && this.CBQObj[fieldName].is_cbq) {		// check if field is CBQ
					if(this.CBQObj[fieldName].visible){		// CBQ field is not valid only if it is VISIBLE
						result = false
					}	
				} else {	// field is not CBQ then it is not valid as validation condition fails
					result = false
				}
			}
			return result
		},
		isValidStep: function(field){		// method to validate Single Question step
			if(!field)
				field = this.order[this.current]
			
			var result = true;
			if(angular.isArray(field)){
				for(var i = 0;i < field.length; i++){
					if(!this.isValidField(field[i])){		// if field is not valid break 'for' loop
						result = false
						break;
					}
				}
			} else if(!this.isValidField(field)){
				result = false
			}
			return result
		},
		showNext: function(){
			var promise = [], self = this, CBQObj = {};
			if(typeof this.callback['before_next'] === 'function')
				this.callback['before_next'].call(this)
			
			if(this.isValidStep()){
				promise = this.handleCBQPromise(this.current + 1);
				// Add all the deferred objects for each field to $q service queue
				$q.all(promise).then(function(cbqCount) {
					self.current++;
					if(cbqCount.indexOf('is-cbq') > -1 || cbqCount.indexOf('is-field') > -1){
						// if promise response has at least one valid CBQ field or a Standard field; broadcast currentUpdated
						$rootScope.$broadcast('currentUpdated')
					}else{
						// if promise response does not have any valid CBQ field or a Standard field then current step is invalid and call the showNext step
						self.showNext()
					}
					self.setProgressBarWidth();
			
					if(typeof self.callback['after_next'] === 'function')
						self.callback['after_next'].call(self)
				});
				return false;
			}
		},
		showPrevious: function(){
			if(typeof this.callback['before_prev'] === 'function')
				this.callback['before_prev'].call(this)
			
			this.current--;
			var prevElem = this.order[this.current];
			$rootScope.$broadcast('currentUpdated');
			this.setProgressBarWidth();
			
			if(typeof this.callback['after_prev'] === 'function')
				this.callback['after_prev'].call(this)
		},
		// ----- we can move setProgressBarWidth() with $broadcast('currentUpdated')
		setProgressBarWidth: function(){
			var width = Math.floor((this.current * 100) / this.steps);
			this.progressBarWidth = width;
			
			$rootScope.$broadcast('progressBarWidthUpdated');
		},
		checkVisibility: function(name){
			if(angular.isArray(this.order[this.current])){
				// if field is CBQ check if field is visible and is in current order
				if(this.CBQObj[name] && this.CBQObj[name].is_cbq){
					return (this.CBQObj[name]['visible'] && this.order[this.current].indexOf(name) > -1)
				} else {
				// for standard field check if field is in current order
					return (this.order[this.current].indexOf(name) > -1)
				}
			}else{
				return name === this.order[this.current]
			}
		},
		getUserData: function(field){
			if(typeof this.callback['getUserData'] === 'function')
				return this.callback['getUserData'].call(this, field)
			return false
		},
		isCBQ: function(field){
			if(typeof this.callback['isCBQ'] === 'function')
				return this.callback['isCBQ'].call(this, field)
			return {}
		},
		extend: function(){
            // Native extend method in javascript
            for(var i = 1; i < arguments.length; i++)
                for(var key in arguments[i])
                    if(arguments[i].hasOwnProperty(key))
                        arguments[0][key] = arguments[i][key];
            return arguments[0];
        },
		getCBQObj: function(){
			var CBQObj = {}
			for(var index = 0; index <= this.order.length - 1; index++) {
				this.extend(CBQObj, this.isCBQ(this.order[index]))
			}
			return CBQObj
		},
		handleCBQPromise: function(current){
			// Method sets 'visible' property of CBQObj for CBQ field and returns array of promises for CBQ and non-CBQ fields
			var nextElem = this.order[current], postDataObj = {}, promises = [], self = this;
			angular.forEach(nextElem, function(fieldName, index){
				var deferredItemList = $q.defer();		// create separate deferred object for each field
				
				//	if current field is CBQ field, call AJAX service that validates CBQ fields
				if(self.CBQObj[fieldName]['is_cbq']){
					//----- need to change CBQ criteria string logic
					postDataObj['key'] = self.cbq[fieldName].k;
					postDataObj[self.cbq[fieldName].p[0]] = self.getUserData(fieldName);
					CBQService.handleCBQ(postDataObj)
						.then(function(data){
							if(data){
								self.CBQObj[fieldName]['visible'] = true;
								// if CBQ field is valid resolve deferred object with "is-cbq" string
								deferredItemList.resolve("is-cbq")
							}else {
								self.CBQObj[fieldName]['visible'] = false;
								// if CBQ field is Not valid resolve deferred object with "cbq-hidden" string
								deferredItemList.resolve("cbq-hidden")
							}
						}, function(data){
							//----- remove/update code once CBQService is in place
							if(data){
								self.CBQObj[fieldName]['visible'] = true;
								deferredItemList.resolve("is-cbq")
							}else {
								self.CBQObj[fieldName]['visible'] = false;
								deferredItemList.resolve("cbq-hidden")
							}
						});	
				} else {
					//	if current field is Standard field, resolve deferred object with "is-field" string
					deferredItemList.resolve("is-field");
				}
				// push all the deferred object for each field in promises array 
				promises.push(deferredItemList.promise);
			})
			// return array of promise objects of each field
			return promises;
		},
		setCurrentValue: function(current, callback){
			// method sets valid step index as current value of SingleQuestion object on init()
			var promise = this.handleCBQPromise(current), self=this;
			// set 'visible' property in CBQObj for CBQ fields before validating current step
			
			$q.all(promise).then(function(data){
				if(self.isValidStep()){
					// only if current step is valid increment current step
					self.current = ++current;
					// always pass callback to recursive function
					return self.setCurrentValue(self.current, callback)
				}
				if(typeof callback === "function")
					callback();
			},
			function(){
				console.log('setCurrentValue(): Error Message')
			})
		}
	}
}]);