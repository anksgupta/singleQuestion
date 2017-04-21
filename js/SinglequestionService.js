  /**
	* - To move to the next step without validating the current step, call SingleQuestion.updateCurrentStep('<next/previous>')
	*/
mainApp.factory("SingleQuestion", ['$rootScope', '$q', 'CBQService', 'UserDataService', 'NotificationService', 'MyConfig', 'RouterService', '$injector', 'CommonValidationService', function($rootScope, $q, CBQService, UserDataService, NotificationService, MyConfig, RouterService, $injector, CommonValidationService){
	var defaults = {
        callbacks: {},
        steps: 0,		// steps can be set in controller if you need to break Single Question flow needs
		preConditions: {},
        autoSubmit: false
	};
	return {
		init: function(options){
			angular.extend(this, defaults, options);
			var deferred = $q.defer(), self = this;
			
			if(self.steps === 0)
				self.steps = self.order.length;
			
			if(typeof self.callbacks['before_load'] === 'function')
				self.callbacks['before_load'].call(self)
			
			// set current property of SingleQuestion object
			self.initCurrentValue(0, function(){
				// callback function - to broadcast 'currentUpdated' event once steps are validated and 'current' is updated
				self.updateCurrentStep('load');
				NotificationService.notify('singleQuestionInitialized');
				
				if(typeof self.callbacks['after_load'] === 'function')
					self.callbacks['after_load'].call(self)
					
				deferred.resolve();
			});
			return deferred.promise;
		},
		isValidField: function(fieldName, setErrorMsg){	// method to validate individual field, fieldName is passed as parameter
			var result = true, deferred = $q.defer(), data = UserDataService.getUserData(fieldName);
		
			UserDataService.clearErrorMsg(fieldName)
			
			if((data.indexOf(null) > -1 || data.indexOf(MyConfig.CBQ_NOT_SHOWN) > -1) && UserDataService.getIsRequired(fieldName)) {	// check if field value contains a null value & is required.
				if(UserDataService.getIsCBQ(fieldName)) {		// check if field is CBQ
					if(UserDataService.getIsVisible(fieldName)){		// CBQ field is VISIBLE, then only it is considered as NOT valid
						if(setErrorMsg)
							UserDataService.setErrorMsg(fieldName)
							
						result = false;
					}	
				} else {	// field is not CBQ then it is not valid as field is empty
					if(setErrorMsg)
						UserDataService.setErrorMsg(fieldName)
						
					result = false
				}
				deferred.resolve(result);
			} else if(this.preConditions[fieldName] || CommonValidationService.fieldValidation[fieldName]) {	// check if field validation is defined in controller
				var promises = [], conditionArr = [this.preConditions[fieldName], CommonValidationService.fieldValidation[fieldName]];
				
				angular.forEach(conditionArr, function(condition){
					if(condition) {
						var deferred = $q.defer(); 	// creating deferred object outside foreach loop will always resolve last deferred object Promise 
						condition().then(function(result){
							deferred.resolve(result)
						});
						promises.push(deferred.promise);
					}
				});
				$q.all(promises).then(function(fieldResult){
					(fieldResult.indexOf(false) > -1) ? deferred.resolve(false): deferred.resolve(true)
				})
			} else {
				deferred.resolve(result)
			}
			return deferred.promise
		},
		isValidSingleQuestionStep: function(obj){		// method to validate Single Question step, one Single Question step can have multiple fields
			var field = (obj && obj.field) ? obj.field : this.order[this.current],
				setErrorMsg = (obj && typeof obj.setErrorMsg !== 'undefined') ? obj.setErrorMsg : true,
				promises = [], stepDeferredObj = $q.defer(), self = this;
				
			angular.forEach(field, function(fieldName){
				var deferred = $q.defer(); 	// creating deferred object outside foreach loop will always resolve last deferred object Promise 
				self.isValidField(fieldName, setErrorMsg).then(function(result){
					deferred.resolve(result)
				});
				promises.push(deferred.promise);
			});
			
			$q.all(promises).then(function(fieldResult){
				(fieldResult.indexOf(false) > -1) ? stepDeferredObj.resolve(false): stepDeferredObj.resolve(true)
			});
			return stepDeferredObj.promise
		},
		callInjectedServices: function(){		// Calls the dynamically injected services which are injected based on A/B tests.
			var promises = [], stepDeferredObj = $q.defer(), dependencies = RouterService.getRouteData().dependencies,
				stepFields = this.order[this.current];
			
			if(dependencies.length > 0){
				angular.forEach(dependencies, function(serviceName){
					var deferred, service;
					// check if service exist and then only inject the service
					$injector.has(serviceName) ? service = $injector.get(serviceName): console.error(serviceName + ': Service not found');
					
					// 'validate' will be a generic method in all the injected services to handle A/B tests with Single Question flow
					if(service && typeof service.validate === 'function'){
						// create deferred object for each Service
						deferred = $q.defer();
						service.validate.call(service).then(function(result) {
							/* 1. 'step-validate' is returned in case there is no need to execute the injected service logic & call stepValidation.
							 * 2. If false is returned, stop at the current step.
							 * 3. If true is returned, move to the next step.
							*/
							if(result === 'step-validate') {
								CommonValidationService.stepValidation(stepFields).then(function(result){
									deferred.resolve(result)
								});
							}else {
								deferred.resolve(result);
							}
						});
						promises.push(deferred.promise);
					}
				});
			} else {
				// if no service is injected call Common StepValidation service
				var deferred = $q.defer();
				CommonValidationService.stepValidation(stepFields).then(function(result){
					deferred.resolve(result)
				});
				promises.push(deferred.promise);
			}
			
			$q.all(promises).then(function(fieldResult){
				// once all deferred object for Services are resolved, callInjectedServices promise is resolved
				(fieldResult.indexOf(false) > -1) ? stepDeferredObj.resolve(false): stepDeferredObj.resolve(true)
			})
			return stepDeferredObj.promise
		},
		showNext: function(){
			var promise = [], self = this;
			
			self.isValidSingleQuestionStep().then(function(result){
				// Single Question step is valid then check for Dynamically injected services validations
				if(result)
					return self.callInjectedServices()
			}).then(function(result){
				if(typeof self.callbacks['before_next'] === 'function')
					self.callbacks['before_next'].call(self)
				if(result){
					// If current step is not the last step, then only proceed further
					if(self.current !== (self.order.length - 1)){
						promise = self.handleCBQPromise(self.current + 1);
						// Add all the deferred objects for each field to $q service queue
						$q.all(promise).then(function(stepFields) {
							if(stepFields.indexOf('is-cbq') > -1 || stepFields.indexOf('is-field') > -1){
								// if promise response has at least one valid CBQ field or a Standard field; broadcast currentUpdated
								self.updateCurrentStep('next');
							}else{
								// if promise response does not have any valid CBQ field or a Standard field then current step is invalid and call the showNext step
								self.current++;
								self.showNext()
							}
					
							if(typeof self.callbacks['after_next'] === 'function')
								self.callbacks['after_next'].call(self)
						});
					}else if(self.autoSubmit){
						$rootScope.$emit('singleQuestionSubmit');
					}
				}
			})
		},
		showPrevious: function(){
			var self = this;
			if(typeof this.callbacks['before_prev'] === 'function')
				this.callbacks['before_prev'].call(this)
			
			this.updateCurrentStep('previous');
			
			// Call dynamically injected services once current is updated
			this.callInjectedServices().then(function(){
				if(typeof self.callbacks['after_prev'] === 'function')
					self.callbacks['after_prev'].call(this)
			})
		},
		updateCurrentStep: function(stepDirection, updatedCurrent){
			var elementsToShow = [], elementsToHide = [];
			
			switch(stepDirection) {
				case 'next':
					elementsToHide = this.order[this.current]
					this.current++;
					break;
				case 'previous':
					elementsToHide = this.order[this.current]
					this.current--;
					break;
				// 'custom' stepDirection will handle cases where you want to set custom current value.(E.g: when we submit the form and there is an error for steps other than the last step)
				case 'custom':
					elementsToHide = this.order[this.current];
					this.current = (this.current !== 0) ? (this.current - 1) : 0; // In case someone passes 'custom' as the stepDirection & doesn't pass updatedCurrent, then move the user to the previous step.
					break;
			}
			
			if(typeof updatedCurrent === 'number') {
				this.current = updatedCurrent
			}
			
			for(var i = 0, currentStep = this.order[this.current]; i < currentStep.length; i++){
				if(this.checkVisibility(currentStep[i])) {
					elementsToShow.push(currentStep[i])
				}
			}
			
			this.setProgressBarWidth();
			this.stepDirection = stepDirection;
			$rootScope.$emit('currentUpdated', {
				stepDirection: stepDirection ? stepDirection : 'next',
				elementsToHide: elementsToHide,
				elementsToShow: elementsToShow,
				progress: this.setProgressBarWidth()
			});
		},
		// progress bar width should always be called before currentUpdated is broadcasted
		setProgressBarWidth: function(){
			return Math.floor((this.current * 100) / this.steps)
		},
		checkVisibility: function(name){
			// check if field is in current order and visible 
			return (this.order[this.current].indexOf(name) > -1 && UserDataService.getIsVisible(name))
		},
		handleCBQPromise: function(current){
			// Method sets 'visible' property for CBQ field and returns array of promises for CBQ and non-CBQ fields
			var nextElem = this.order[current], postDataObj = {}, promises = [], self = this;
			angular.forEach(nextElem, function(fieldName, index){
				var deferredItemList = $q.defer();		// create separate deferred object for each field
				
				//	if current field is CBQ field, call AJAX service that validates CBQ fields
				if(UserDataService.getIsCBQ(fieldName)){
					CBQService.getCBQData(fieldName)
						.then(function(data){
							/*if(data){
								UserDataService.setIsVisible(fieldName, true);
								// if CBQ field is valid resolve deferred object with "is-cbq" string
								deferredItemList.resolve("is-cbq")
							}else {
								UserDataService.setIsVisible(fieldName, false);
								// if CBQ field is Not valid resolve deferred object with "cbq-hidden" string
								deferredItemList.resolve("cbq-hidden")
							}*/
							// If CBQ field is valid, resolve deferred object with "is-cbq" string else resolve with "cbq-hidden" string
							UserDataService.setIsVisible(fieldName, data)[(data ? 'clearCbq': 'setCbq') + 'NotShown'](fieldName);
							deferredItemList.resolve(data ? "is-cbq" : "cbq-hidden")
						}, function(data){
							//----- remove/update code once CBQService is in place
							if(data){
								UserDataService.setIsVisible(fieldName, true);
								deferredItemList.resolve("is-cbq")
							}else {
								UserDataService.setIsVisible(fieldName, false);
								deferredItemList.resolve("cbq-hidden")
							}
						});	
				} else {
					//	if current field is Standard field, resolve deferred object with "is-field" string
					UserDataService.setIsVisible(fieldName, true);
					deferredItemList.resolve("is-field");
				}
				// push all the deferred object for each field in promises array 
				promises.push(deferredItemList.promise);
			})
			// return array of promise objects of each field
			return promises;
		},
		initCurrentValue: function(current, callback){
			// method sets valid step index as current value of SingleQuestion object on init()
			var promise = this.handleCBQPromise(current), self = this;
			// set 'visible' property before validating current step
			
			$q.all(promise).then(function(data){
				self.isValidSingleQuestionStep({field: self.order[current], setErrorMsg: false}).then(function(result){
					if(result && (typeof self.current === 'undefined' || current < self.current)){
						// only if current step is valid increment current step
						++current;
						// always pass callback to recursive function
						self.initCurrentValue(current, callback)
					}else if(typeof callback === "function") {
						// finally set SingleQuestion object current equal to calculated current
						self.current = current;
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
				if(UserDataService.getIsVisible(step[i])){
					visibleFieldArr.push({
						name: step[i],
						type: UserDataService.getFieldType(step[i]).toLowerCase()
					})
				}
			}
			return visibleFieldArr;
		}
	}
}]);