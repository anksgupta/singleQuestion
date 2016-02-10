mainApp.factory("SingleQuestion", ['$rootScope', 'CBQService', '$q', function($rootScope, CBQService, $q){
	var defaults = {
        callback: {},
        current: 0,
        steps: 0,
		cbq: {},
		CBQObj: {},
		fieldValidations: {},
        autoSubmit: false
	};
	return {
		init: function(options){
			angular.extend(this, defaults, options);
			var self = this;
			this.current = 0, 
			this.steps = this.order.length,
			this.CBQObj = this.getCBQObj();	// create CBQObj on init, object is used to verify if field is CBQ type
			
			if(typeof this.callback['before_load'] === 'function')
				this.callback['before_load'].call(this)
			
			// set current property of SingleQuestion object
			this.setCurrentValue(this.current, function(){
				// callback function- to broadcast 'currentUpdated' event once steps are validated and 'current' is updated
				self.setProgressBarWidth();
				$rootScope.$broadcast('currentUpdated');
				
				if(typeof self.callback['after_load'] === 'function')
					self.callback['after_load'].call(self)
			});
			
			return this
		},
		isValidField: function(fieldName){	// method to validate individual field, fieldName is passed as parameter
			var result = true, deferred = $q.defer();
			
			if(!this.getUserData(fieldName)) {		// check if field value is empty
				if(this.CBQObj[fieldName] && this.CBQObj[fieldName].is_cbq) {		// check if field is CBQ
					if(this.CBQObj[fieldName].visible){		// CBQ field is VISIBLE then only it is considered as NOT valid 
						result = false;
					}	
				} else {	// field is not CBQ then it is not valid as field is empty
					result = false
				}
				deferred.resolve(result);
			}else if(this.fieldValidations[fieldName]){	// check if field validation is defined in controller
				this.fieldValidations[fieldName].call(this).then(function(result){	
					deferred.resolve(result);
				})
			}else{
				deferred.resolve(result)
			}
			return deferred.promise;
			//return result
		},
		isValidSingleQuestionStep: function(field){		// method to validate Single Question step, one Single Question step can have multiple fields
			if(!field)
				field = this.order[this.current]
			
			var result = true, promises = [], stepDeferredObj = $q.defer(), self = this;
			angular.forEach(field, function(fieldName, index){
				var deferred = $q.defer(); 	// creating deferred object outside foreach loop will always resolve last deferred object Promise 
				self.isValidField(fieldName).then(function(result){
					deferred.resolve(result)
				});
				promises.push(deferred.promise);
			});
			$q.all(promises).then(function(fieldResult){
				(fieldResult.indexOf(false) > -1) ? stepDeferredObj.resolve(false): stepDeferredObj.resolve(true);
			})
			return stepDeferredObj.promise
		},
		showNext: function(){
			var promise = [], self = this, CBQObj = {};
			if(typeof this.callback['before_next'] === 'function')
				this.callback['before_next'].call(this)
			
			this.isValidSingleQuestionStep().then(function(result){
				if(result){
				// If current step is not the last step, then only proceed further
					if(self.current !== (self.order.length - 1)){
						promise = self.handleCBQPromise(self.current + 1);
						// Add all the deferred objects for each field to $q service queue
						$q.all(promise).then(function(cbqCount) {
							self.current++;
							self.setProgressBarWidth();
							if(cbqCount.indexOf('is-cbq') > -1 || cbqCount.indexOf('is-field') > -1){
								// if promise response has at least one valid CBQ field or a Standard field; broadcast currentUpdated
								$rootScope.$broadcast('currentUpdated', {elementToHide: self.order[self.current - 1]})
							}else{
								// if promise response does not have any valid CBQ field or a Standard field then current step is invalid and call the showNext step
								self.showNext()
							}
					
							if(typeof self.callback['after_next'] === 'function')
								self.callback['after_next'].call(self)
						});
					}else if(self.autoSubmit){
						if(typeof self.callback['submit'] === 'function')
							self.callback['submit'].call(self)
					}
				}
				//return false;
			})
		},
		showPrevious: function(){
			if(typeof this.callback['before_prev'] === 'function')
				this.callback['before_prev'].call(this)
			
			this.current--;
			var prevElem = this.order[this.current];
			this.setProgressBarWidth();
			$rootScope.$broadcast('currentUpdated', {elementToHide: this.order[this.current + 1]})
			
			if(typeof this.callback['after_prev'] === 'function')
				this.callback['after_prev'].call(this)
		},
		// ----- we can move setProgressBarWidth() with $broadcast('currentUpdated')
		setProgressBarWidth: function(){
			var width = Math.floor((this.current * 100) / this.steps);
			this.progressBarWidth = width;
		},
		checkVisibility: function(name){
			// if field is CBQ check if field is visible and is in current order
			if(this.CBQObj[name] && this.CBQObj[name].is_cbq){
				return (this.CBQObj[name]['visible'] && this.order[this.current].indexOf(name) > -1)
			} else {
			// for standard field check if field is in current order
				return (this.order[this.current].indexOf(name) > -1)
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
			var CBQObj = {};
			for(var index = 0; index <= this.order.length - 1; index++) {
				this.extend(CBQObj, this.isCBQ(this.order[index]));
			}
			return CBQObj;
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
				self.isValidSingleQuestionStep().then(function(result){
					if(result){
						// only if current step is valid increment current step
						self.current = ++current;
						// always pass callback to recursive function
						self.setCurrentValue(self.current, callback)
					}else if(typeof callback === "function") {
						callback();
					}
				})
			},
			function(){
				console.log('setCurrentValue(): Error Message')
			})
		}
	}
}]);