// Directive which dynamically creates form fields based on the input type
mainApp.directive('generateField', ['MyConfig', '$compile', function(MyConfig, $compile) {
		return {
			restrict: 'E',
			scope: {
				fieldType: '@',
				user: '=',
				field: '='
			},
			link: function (scope, element, attrs) {
				var template = "<" + MyConfig.TEMPLATE_CONFIG[scope.fieldType] + " user='user' field='field'></" + MyConfig.TEMPLATE_CONFIG[scope.fieldType] + ">";
				element.append($compile(template)(scope))
			}
		}
}]);

// Tracking Directive 
mainApp.directive('tracker', ['TrackingService', 'MyConfig', function(TrackingService, MyConfig) {
		return {
			restrict: 'E',
			scope: {
				user: '='
			},
			link: function (scope, element, attrs) {
				for(var key in scope.user){
					(function(key){
						scope.$watch('user.' + key + '.value', function(newValue, oldValue) {
							var log = {};
							// Check if the values are different and CBQ_NOT_SHOWN is not present in any of the values.
							if(!angular.equals(newValue, oldValue) && JSON.stringify(newValue).indexOf(MyConfig.CBQ_NOT_SHOWN) === -1) {
								// If newValue & oldValue are objects, then log those fields whose values have changed.
								if(typeof newValue === 'object' && typeof oldValue === 'object') {
									for(var field in newValue) {
										if(newValue[field] !== oldValue[field]) {
											log[field] = newValue[field]
										}
									}
								} else {
									log[key] = newValue
								}
								for(field in log) {
									TrackingService.log({
										eventType: 'elem-change',
										position: field + '_' + log[field]
									})
								}
							}
						}, true);
					}(key))
				}
			}
		}
}]);

// Common SL Directive 
mainApp.directive('commonSl', ['$httpParamSerializer', function($httpParamSerializer) {
		return {
			restrict: 'E',
			scope: {
				slId: '@',
				domain: '@',
				params: '=',
				errorCallback: '&?'
					//'&' = callback function is defined always.
					//'&?' = callback function is defined only when attribute is defined in html template.
			},
			template: '<div id="{{slId}}" class="cachedWidget qs-listings"></div>',
			link: function (scope, element, attrs) {
				var slScript = document.createElement('script'), errorFn = '';
				if(typeof scope.errorCallback === 'function'){
					window[scope.slId.replace(/-|_/gi, '')] = scope.errorCallback;
					errorFn = '&errorCallback=' + scope.slId.replace(/-|_/gi, '')
				}
				slScript.src = scope.domain + (scope.domain.indexOf('?') > -1 ? '' : '?') + $httpParamSerializer(scope.params) + errorFn;
				element.append(slScript);
			}
		}
}]);

// Directive which checks if inner content has loaded
mainApp.directive('elemReady', ['$rootScope', 'NotificationService', function($rootScope, NotificationService) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) { 
				var eventsArr = attrs.elemReady.split(',');
				$rootScope.$on('eventNotified', function(event, args){
					eventsArr.splice(0, 1);
					if(eventsArr.length > 0){
						$rootScope.$emit(eventsArr[0])
					}
				});
				elem.ready(function(){
					$rootScope.$emit(eventsArr[0]);
					// need to check alternative. remove apply and check the timing issue - WP,HP watchers not getting fired on elem.ready()
					scope.$apply();
				});
				
			}
		}
}])

// Home phone directive
mainApp.directive("phoneField", ['TcpaService', 'NotificationService', 'UserDataService', '$rootScope', function(TcpaService, NotificationService, UserDataService, $rootScope){
	return {
		restrict: 'E',
		replace: true,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-switch="field.is_single_col">' +
					'<div ng-switch-when="true"><input ng-model-options="{\'updateOn\': \'blur\'}" name="qs-{{field.name}}" type="tel" maxlength="" placeholder="" ng-model="singlePhoneNumber.value"/></div>' +
					'<div ng-switch-when="false">' +
						'<input id="{{field.name}}_AREA" ng-model-options="{\'updateOn\': \'blur\'}" name="{{field.name}}_AREA" type="tel" maxlength="3" placeholder="" ng-model="area.value"/>' +
						'<input id="{{field.name}}_PREFIX" ng-model-options="{\'updateOn\': \'blur\'}" name="{{field.name}}_PREFIX" type="tel" maxlength="3" placeholder="" ng-model="prefix.value"/>' +
						'<input id="{{field.name}}_NUMBER" ng-model-options="{\'updateOn\': \'blur\'}" name="{{field.name}}_NUMBER" type="tel" maxlength="4" placeholder="" ng-model="number.value"/>' +
					'</div>' +
			    '</div>',
		link: function(scope, element, attrs){
			// Check the implementation for $watch. It dosesn't fire when we watch a primitive value inside a directive. We have implemented a work around at the moment. Need to revisit this implementation.
			NotificationService.subscribe('repeatComplete', function(event, args){
				var fieldName = scope.field.name, prefixElem, numberElem;
				if(scope.field.is_single_col) {
					scope.singlePhoneNumber = {};
					scope.singlePhoneNumber.value = scope.user[fieldName].value[fieldName + "_AREA"] + 
										scope.user[fieldName].value[fieldName + "_PREFIX"] +
										scope.user[fieldName].value[fieldName + "_NUMBER"];
										
					scope.$watch('singlePhoneNumber.value', function(newValue, oldValue) {
						var phoneNumber = newValue.replace(/[^0-9]/g, ''),
							contactMe = UserDataService.getUserData('ContactMe');
						TcpaService.handleTCPA({
								number: phoneNumber, 
								contactMe: (contactMe.indexOf(null) > -1) ? false : contactMe.join(''),
								fieldName: fieldName
							}).then(function(){
								NotificationService.notify('repeatComplete');
							});
						scope.user[fieldName].value[fieldName + "_AREA"] = phoneNumber.substring(0, 3);
						scope.user[fieldName].value[fieldName + "_PREFIX"] = phoneNumber.substring(3, 6);
						scope.user[fieldName].value[fieldName + "_NUMBER"] = phoneNumber.substring(6)
					});
				} else {
					scope.area = {value: scope.user[fieldName].value[fieldName + "_AREA"]};
					scope.prefix = {value: scope.user[fieldName].value[fieldName + "_PREFIX"]};
					scope.number = {value: scope.user[fieldName].value[fieldName + "_NUMBER"]};
					
					prefixElem = document.getElementById(fieldName + '_PREFIX');
					numberElem = document.getElementById(fieldName + '_NUMBER');
										
					scope.$watch('[area.value, prefix.value, number.value]', function(newValues, oldValues) {
						var phoneNumber = scope.area.value + scope.prefix.value + scope.number.value,
							contactMe = UserDataService.getUserData('ContactMe');
						TcpaService.handleTCPA({
								number: phoneNumber, 
								contactMe: (contactMe.indexOf(null) > -1) ? false : contactMe.join(''),
								fieldName: fieldName
							}).then(function(){
								NotificationService.notify('repeatComplete');
							});
						if (newValues[0] !== oldValues[0] && (newValues[0].length === 3)){ // Check if area is changed & length === maxlength, then move cursor to prefix field
							prefixElem.focus();
						}else if (newValues[1] !== oldValues[1] && (newValues[1].length === 3)){ // Check if prefix is changed & length === maxlength, then move cursor to number field
							numberElem.focus();
						}
						scope.user[fieldName].value[fieldName + "_AREA"] = newValues[0];
						scope.user[fieldName].value[fieldName + "_PREFIX"] = newValues[1];
						scope.user[fieldName].value[fieldName + "_NUMBER"] = newValues[2]
					}, true);
				}
			});
		}
	}
}]);

// TCPA directive
mainApp.directive("homePhoneConsent",['UserDataService', 'TcpaService', function(UserDataService, TcpaService){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-switch="field.type">' + 
					'<div ng-switch-when="Text">' +
						'<label>' + 
							// don't use ng-model and only use value attribute so LeadId script can read the field
							// ng-model will set value property and not the attribute
							'<input class="ng-hide" id="leadid_tcpa_disclosure" name="HomePhoneConsent" type="text" value="{{user[field.name].value}}">' + 
							'<span>{{field.label}}</span>' + 
						'</label>' + 
					'</div>' + 
					'<div ng-switch-when="Checkbox">' + 
						'<label ng-repeat="option in field.options">' + 
							/* For checkbox case, LeadID will read value only if checkbox is checked.
							   In case checked attribute is set using javascript, Passive consent issue may occur from LeadID
							   so we've used ng-if to show/hide HTML input with checked attribute */ 
							'<input ng-if="isChecked==\'field.value\'" name="HomePhoneConsent" type="checkbox" checked value="{{field.value}}" ng-model="user[field.name].value" ng-change="setValue()" ng-true-value="{{field.value}}" ng-false-value="\'\'"/>' + 
							'<input ng-if="isChecked!=\'field.value\'" name="HomePhoneConsent" type="checkbox" value="{{field.value}}" ng-model="user[field.name].value" ng-change="setValue()" ng-true-value="{{field.value}}" ng-false-value="\'\'"/>' + 
							'<span>{{option.label}}</span>' + 
						'</label>' + 
					'</div>',
		link: function(scope, element, attrs){
			// HomePhoneConsent field is hidden/shown coz of ng-hide class(!important).
			scope.$on('ShowPhoneConsent', function(event, args){
				var consentContainer = document.getElementById('input-HomePhoneConsent');
				if(consentContainer)
					angular.element(consentContainer)[(args.showConsent ? 'remove' : 'add') + 'Class']('ng-hide')
				
				UserDataService.setIsVisible('HomePhoneConsent', args.showConsent);
				
				if(scope.field.type !== 'Checkbox') {
					scope.user['HomePhoneConsent'].value = (args.showConsent ? 'Yes' : '')
				}
			});
			
			// Below code handles TCPA for contact/increment page.
			if(UserDataService.getFieldType('HP') === 'Hidden' || UserDataService.getFieldType('WP') === 'Hidden') {
				var phoneVal = {
					HP: (UserDataService.getUserData('HP').indexOf(null) > -1) ? '' : UserDataService.getUserData('HP').join(''),
					WP: (UserDataService.getUserData('WP').indexOf(null) > -1) ? '' : UserDataService.getUserData('WP').join('')
				}, contactMe = UserDataService.getUserData('ContactMe');
				
				for(var key in phoneVal) {
					if(phoneVal[key].length === 10) {
						TcpaService.handleTCPA({
								number: phoneVal[key], 
								contactMe: (contactMe.indexOf(null) > -1) ? false : contactMe.join(''),
								fieldName: key
							});
					}
				}
			}
			if(scope.field.type === 'Checkbox') {
				scope.isChecked = scope.user['HomePhoneConsent'].value;
				scope.setValue = function(){
					scope.isChecked = scope.user['HomePhoneConsent'].value;
				}
			}
		}
	}
}]);

// Select field directive
mainApp.directive("selectField", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<select name="qs-{{field.name}}" ng-model="user[field.name].value" ng-options="option.value as option.label for option in field.options">' + '<option value="" hidden>-- Select One --</option></select>' +
		'<field-actual-value user="user" field-name="{{field.name}}"></field-actual-value>'
	}
});

// HomePhoneConsent field can be of type textbox as well as checkbox. The below directive handles text, checkbox & HomePhoneConsent field directives
mainApp.directive("generateFieldByType", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-switch="field.name">' + 
					'<generate-field ng-switch-when="HomePhoneConsent" field-type="HomePhoneConsent" user="user" field="field"></generate-field>' + 
					'<generate-field ng-switch-default field-type="Actual{{field.type}}" user="user" field="field"></generate-field>' + 
				'</div>'
	}
});

// Text field directive
mainApp.directive("textField", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		// ng-model-options are passed so that model will be updated only when the focus is lost.
		template: 
			'<div>' + 
				'<input name="qs-{{field.name}}" ng-model="user[field.name].value" ng-model-options="{\'updateOn\': \'blur\'}"/>' + 
				'<field-actual-value user="user" field-name="{{field.name}}"></field-actual-value>' + 
			'</div>',
		link: function(scope, element, attrs){}
	}
});

// Checkbox field directive
mainApp.directive("checkboxField", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<div>' + 
					'<label ng-repeat="option in field.options">' + 
						'<input type="checkbox" name="qs-{{field.name}}" ng-true-value="\'{{option.value}}\'" ng-false-value="\'\'" ng-change="setValue(option)" ng-model="option.checked"/>' + 
						'<span>{{option.label}}</span>' + 
					'</label>' + 
					'<field-actual-value user="user" field-name="{{field.name}}"></field-actual-value>' + 
				'</div>',
		link: function(scope, element, attrs){
			var values = scope.user[scope.field.name].value.split(',');
			if(values.length > 0){
				for(var option = 0, valueIndex; option < scope.field.options.length; option++){
					valueIndex = values.indexOf(scope.field.options[option].value)
					if(valueIndex > -1){
						scope.field.options[option].checked = values[valueIndex];
						break
					}
				}
			}
			scope.setValue = function(option){
				values = scope.user[scope.field.name].value.split(',');
				if(option.checked && values.indexOf(option.value) === -1){
					values.push(option.value)
				}else if(!option.checked && values.indexOf(option.value) > -1){
					values.splice(values.indexOf(option.value), 1)
				}
				
				scope.user[scope.field.name].value = values.join(',')
			}
		}
	}
});

// Radio button directive
mainApp.directive("fieldActualValue", function(){
	return {
		restrict: 'E',
		replace: true,
		scope: {
			user: '=',
			fieldName: '@'
		},
		template: '<input name="{{fieldName}}" type="text" style="display: none;" data-leadid="true" value="{{user[fieldName].value}}">'
	}
});

// Radio button directive
mainApp.directive("radioInTable", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-click="updateModel(field.name, option.value)" ng-class="{myclass: option.value == user[field.name].value}" ng-repeat="option in 	' 			+ 'field.options">{{option.label}}</div><field-actual-value user="user" field-name="{{field.name}}"></field-actual-value>',
		link: function(scope, element, attrs){
			scope.updateModel = function(fieldName, value) {
				if(scope.user[fieldName].value === value)
					scope.user[fieldName].unchanged = new Date().getTime()  // flag to handle a case in which user clicks on the same option and shownext should be called
                scope.user[fieldName].value = value;
            }
		}
	}
});

// Custom select(similar to JQM select) directive
mainApp.directive("customSelect", function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<div class="select-container">' + 
					'<span class="selected-text">{{user[field.name].value}}</span>' + 
					'<ul name="{{field.name}}" ng-model="user[field.name]">'+
						'<li ng-repeat="option in field.options" ng-click="updateModel(option.value)" ng-class="{myclass: option.value == user[field.name]}">{{option.label}}</li>'+
					'</ul>'+
					'<select name="qs-{{field.name}}" ng-model="user[field.name]" ng-options="option.value as option.label for option in field.options"></select>' + 
					'<field-actual-value user="user" field-name="{{field.name}}"></field-actual-value>' +
				'</div>',
	    link: function(scope, element, attrs) {
			var fieldName = scope.field.name;
			scope.updateModel = function(value) {
				if(scope.user[fieldName].value === value)
					scope.user[fieldName].unchanged = new Date().getTime()  // flag to handle a case in which user clicks on the same option and shownext should be called
                scope.user[fieldName].value = value;
            }
	    }
	}
});

mainApp.directive('directiveIf', ['$compile',
    function($compile) {
        // Error handling.
        var compileGuard = 0;
        // End of error handling.
        return {
            // Set a high priority so we run before other directives.
            priority: 100,
            // Set terminal to true to stop other directives from running.
            terminal: true,
            compile: function() {
                return {
                    pre: function(scope, element, attr) {
                        // Error handling.
                        // Make sure we don't go into an infinite compile loop
                        // if something goes wrong.
                        compileGuard++;
                        if (compileGuard >= 10) {
                            console.log('directiveIf: infinite compile loop!');
                            return;
                        }
                        // End of error handling.
                        // Get the set of directives to apply.
                        var directives = scope.$eval(attr.directiveIf);
                        angular.forEach(directives, function(expr, directive) {
                            // Evaluate each directive expression and remove
                            // the directive attribute if the expression evaluates
                            // to 'false'.
                            var result = scope.$eval(expr);
                            if (result === false) {
                                // Set the attribute to 'null' to remove the attribute.
                                attr.$set(directive, null)
                            }
                        });
                        // Remove our own directive before compiling
                        // to avoid infinite compile loops.
                        attr.$set('directiveIf', null);

                        // Recompile the element so the remaining directives
                        // can be invoked.
                        var result = $compile(element)(scope);
                        // Error handling.
                        // 
                        // Reset the compileGuard after compilation
                        // (otherwise we can't use this directive multiple times).
                        // 
                        // It should be safe to reset here because we will
                        // only reach this code *after* the `$compile()`
                        // call above has returned.
                        compileGuard = 0;

                    }
                };
            }
        };
}]);

// CBQ directive to handle criteria on contact & increment pages
mainApp.directive('cbq', ['UserDataService', 'CBQService', function(UserDataService, CBQService){
	return {
		restrict: 'A',
		scope: {
			fieldname: '@',
			user: '='
		},
		link: function link(scope, element, attrs) {
			var criteriaObj = UserDataService.getFieldCriteria(fieldname);
			if(criteriaObj) {
				angular.forEach(criteriaObj.p, function(parent){
					scope.$watchCollection(function(){return UserDataService.getUserData(parent)}, function(newValue, oldValue) {
						CBQService.getCBQData(scope.fieldname)
							.then(function(data){
								element[(data ? 'remove' : 'add') + 'Class']('ng-hide');
								UserDataService[(data ? 'clearCbq': 'setCbq') + 'NotShown'](scope.fieldname);
								UserDataService.setIsVisible(scope.fieldname, data)
							}, function(data){
								console.log('ajax failed - promise rejected')
								false ? element.removeClass('ng-hide') : element.addClass('ng-hide');
							})
					});
				});
			}
	    }
	}
}]);

/**
*	@params
*	validateBeforeSubmit: Contains reference to a function which you want to execute before form is submitted.
*	emittedEvent: If you want to manually submit a form, then pass the eventname to this directive. When this event is emitted, the form will be submitted. One scenario is the auto submit case in singlequestion.
*/
mainApp.directive('submitBtn', ['HttpService', '$rootScope', 'UserDataService', 'RouterService', 'SingleQuestion', function(HttpService, $rootScope, UserDataService, RouterService, SingleQuestion){
	return {
		restrict: 'E',
		scope: {
			text: '@',
			validateBeforeSubmit: '&?',
			emittedEvent: '@',
			url: '@'
		},
		template: '<button id="submitBtn" ng-click="submit()">' + 
					'<span>{{text}}</span>' +
					'<span class="processing">Processing...</span></button>',
		link: function link(scope, element, attrs) {
			var url = scope.url ? ('/' + scope.url.replace(/.do|\//, '') + '.do') : '/submit.do',
				validateBeforeSubmit = (typeof scope.validateBeforeSubmit === 'function') ? scope.validateBeforeSubmit : UserDataService.validateFields;
			function submitForm(){
				HttpService.getData(url, UserDataService.getFinalUserData()).then(function(json){
					RouterService.navigate(json)
				}, function(json){
					//RouterService.navigate(json)
				})
			}
			
			scope.submit = function() {
				validateBeforeSubmit().then(function(result){
					if(result)
						submitForm()
				})
            };
			
			if(scope.emittedEvent){
				$rootScope.$on(scope.emittedEvent, function(event, args){
					scope.submit()
				});
			}
	    }
	}
}]);

// SingleQuestion directive
mainApp.directive('singleQuestionDirective',['$rootScope', 'SingleQuestion', 'SingleQStepVisibilityService', 'NotificationService', function($rootScope, SingleQuestion, SingleQStepVisibilityService, NotificationService) {
	return {
        restrict: 'E',
        scope: {
			user: '=',
			singleQuestionOptions: '='
		},
		// The parenthesis after isValidSingleQuestionStep is V.V.V.V.V.V.V.V.V.V Imp. Without the parenthesis, the function we pass will never get called.
		// This might be because we are passing the function reference to a nested directive. PLEEEEEEEEASE LOOK INTO THIS.
		template: '<a href="javascript:;" id="backBtn" ng-click="showPrevious();">Back</a>' +
				'<button id="nextBtn" ng-click="showNext();">Next</button>' +
				'<submit-btn text="submit btn" validate-before-submit="isValidSingleQuestionStep()" emitted-event="singleQuestionSubmit"></submit-btn>' +
				'<div class="rail"><div class="inner_rail"><div class="bar" ng-style="{\'width\': progressBarWidth + \'%\'}"></div></div></div>',
		controller: ['$scope', function($scope){
			var singleQFunctionsToExpose = ['showNext', 'showPrevious', 'isValidSingleQuestionStep'];
			for(var  i = 0; i < singleQFunctionsToExpose.length; i++){
				(function(i){
					$scope[singleQFunctionsToExpose[i]] = function(){
						return SingleQuestion[singleQFunctionsToExpose[i]]()
					}
				}(i))
			}
		}],
        link: function(scope, element, attrs){
			var nextBtnElem = angular.element(document.getElementById('nextBtn')), 
				backBtnElem = angular.element(document.getElementById('backBtn')), 
				submitBtn= angular.element(document.getElementById('submitBtn')),
				showNextBtn = function(){
					nextBtnElem.addClass('ng-hide');
					if(SingleQuestion.current !== SingleQuestion.order.length - 1){
						var step = SingleQuestion.order[SingleQuestion.current];
						/** Next button should be shown:
							- if multiple visible fields are present in Step
							- else if single field is present and it is textbox
							- else if current Step is valid
						*/
						if(SingleQuestion.getCBQVisibleFieldObj().length > 1){
							nextBtnElem.removeClass('ng-hide')
						} else if((SingleQuestion.getCBQVisibleFieldObj()[0].type).toLowerCase() === "text") {
							nextBtnElem.removeClass('ng-hide')
						} else{
							SingleQuestion.isValidSingleQuestionStep().then(function(result){
								result ? nextBtnElem.removeClass('ng-hide') : nextBtnElem.addClass('ng-hide');
							});
						}
					}
				};
			
			$rootScope.$on('currentUpdated', function(event, args){
				// update current and validate next step
				showNextBtn();
				SingleQStepVisibilityService.showHideStep({
						stepDirection: args.stepDirection,
						elementsToHide: args.elementsToHide,
						elementsToShow: args.elementsToShow
					});
				(SingleQuestion.current === SingleQuestion.order.length - 1) ? submitBtn.removeClass('ng-hide') : submitBtn.addClass('ng-hide');
				(SingleQuestion.current !== 0) ? backBtnElem.removeClass('ng-hide') : backBtnElem.addClass('ng-hide');
				
				scope.progressBarWidth = SingleQuestion.progressBarWidth
			});
			
			NotificationService.subscribe('singleQuestionInitialized', function(event, args){
				var typesToIgnore = 'text|checkbox';
				
				SingleQuestion.init(scope.singleQuestionOptions).then(function(){
					// Bind watchers only after SingleQuestion init method is resolved.
					for(var i = 0;i < SingleQuestion.order.length; i++){
						var step = SingleQuestion.order[i];
						for(var j = 0;j < step.length; j++){
							(function(field){
								scope.$watch('user.' + field + '.value', function(newValue, oldValue) {
									var conditionArray = [!angular.equals(newValue, oldValue),
															SingleQuestion.getCBQVisibleFieldObj().length === 1,
															typesToIgnore.indexOf(SingleQuestion.getCBQVisibleFieldObj()[0].type) === -1,
															newValue !== "CBQ_NOT_SHOWN" && oldValue !== "CBQ_NOT_SHOWN"];
									if(eval(conditionArray.join('&&'))){
										// If current order has only one visible field, then call ShowNext on model update.
										SingleQuestion.showNext()
									}
								});
							}(step[j]))
						}			
					}
				});
				
			});
        }
    }      
}]);