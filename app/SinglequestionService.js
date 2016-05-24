mainApp.factory("SingleQuestion", ['$rootScope', 'CBQService', '$q', 'InitializationService', function($rootScope, CBQService, $q, InitializationService){
	var defaults = {
        callbacks: {},
        current: 0,
        steps: 0,		// steps can be set in controller if you need to break Single Question flow needs
		fieldValidations: {},
        autoSubmit: false
	};
	return {
		init: function(options){
			angular.extend(this, defaults, options);
			var self = this;
			this.current = 0;
			
			if(this.steps === 0)
				this.steps = this.order.length;
			
			if(typeof this.callbacks['before_load'] === 'function')
				this.callbacks['before_load'].call(this)
			
			// set current property of SingleQuestion object
			this.setCurrentValue(this.current, function(){
				// callback function- to broadcast 'currentUpdated' event once steps are validated and 'current' is updated
				self.setProgressBarWidth();
				$rootScope.$broadcast('currentUpdated');
				
				if(typeof self.callbacks['after_load'] === 'function')
					self.callbacks['after_load'].call(self)
			});
		},
		isValidField: function(fieldName){	// method to validate individual field, fieldName is passed as parameter
			var result = true, deferred = $q.defer();
			
			if(!InitializationService.getUserData(fieldName)) {	// check if field value is empty
				if(InitializationService.getIsCBQ(fieldName)) {		// check if field is CBQ
					if(InitializationService.getIsVisible(fieldName)){		// CBQ field is VISIBLE then only it is considered as NOT valid 
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
			var promise = [], self = this;
			
			this.isValidSingleQuestionStep().then(function(result){
				if(typeof self.callbacks['before_next'] === 'function')
					self.callbacks['before_next'].call(self)
				if(result){
				// If current step is not the last step, then only proceed further
					if(self.current !== (self.order.length - 1)){
						promise = self.handleCBQPromise(self.current + 1);
						// Add all the deferred objects for each field to $q service queue
						$q.all(promise).then(function(stepFields) {
							self.current++;
							self.setProgressBarWidth();
							if(stepFields.indexOf('is-cbq') > -1 || stepFields.indexOf('is-field') > -1){
								// if promise response has at least one valid CBQ field or a Standard field; broadcast currentUpdated
								$rootScope.$broadcast('currentUpdated', {elementToHide: self.order[self.current - 1]})
							}else{
								// if promise response does not have any valid CBQ field or a Standard field then current step is invalid and call the showNext step
								self.showNext()
							}
					
							if(typeof self.callbacks['after_next'] === 'function')
								self.callbacks['after_next'].call(self)
						});
					}else if(self.autoSubmit){
						if(typeof self.callbacks['submit'] === 'function')
							self.callbacks['submit'].call(self)
					}
				}
			})
		},
		showPrevious: function(){
			if(typeof this.callbacks['before_prev'] === 'function')
				this.callbacks['before_prev'].call(this)
			
			this.current--;
			var prevElem = this.order[this.current];
			this.setProgressBarWidth();
			$rootScope.$broadcast('currentUpdated', {elementToHide: this.order[this.current + 1]})
			
			if(typeof this.callbacks['after_prev'] === 'function')
				this.callbacks['after_prev'].call(this)
		},
		// progress bar width should always be called before currentUpdated is broadcast
		setProgressBarWidth: function(){
			var width = Math.floor((this.current * 100) / this.steps);
			this.progressBarWidth = width;
		},
		checkVisibility: function(name){
			// check if field is in current order and visible 
			return (this.order[this.current].indexOf(name) > -1 && InitializationService.getIsVisible(name))
		},
		handleCBQPromise: function(current){
			// Method sets 'visible' property for CBQ field and returns array of promises for CBQ and non-CBQ fields
			var nextElem = this.order[current], postDataObj = {}, promises = [], self = this;
			angular.forEach(nextElem, function(fieldName, index){
				var deferredItemList = $q.defer();		// create separate deferred object for each field
				
				//	if current field is CBQ field, call AJAX service that validates CBQ fields
				if(InitializationService.getIsCBQ(fieldName)){
					CBQService.getCBQData(fieldName)
						.then(function(data){
							if(data){
								InitializationService.setIsVisible(fieldName, true);
								// if CBQ field is valid resolve deferred object with "is-cbq" string
								deferredItemList.resolve("is-cbq")
							}else {
								InitializationService.setIsVisible(fieldName, false);
								// if CBQ field is Not valid resolve deferred object with "cbq-hidden" string
								deferredItemList.resolve("cbq-hidden")
							}
						}, function(data){
							//----- remove/update code once CBQService is in place
							if(data){
								InitializationService.setIsVisible(fieldName, true);
								deferredItemList.resolve("is-cbq")
							}else {
								InitializationService.setIsVisible(fieldName, false);
								deferredItemList.resolve("cbq-hidden")
							}
						});	
				} else {
					//	if current field is Standard field, resolve deferred object with "is-field" string
					InitializationService.setIsVisible(fieldName, true);
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
			var promise = this.handleCBQPromise(current), self = this;
			// set 'visible' property before validating current step
			
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
		},
		getCBQVisibleFieldObj: function(){
		// returns Array of visible field object
			var step = this.order[this.current], visibleFieldArr = [];
			for(var i = 0; i < step.length; i++){
				if(InitializationService.getIsVisible(step[i])){
					visibleFieldArr.push({
						name: step[i],
						type: InitializationService.getFieldType(step[i])
					})
				}
			}
			return visibleFieldArr;
		}
	}
}]);