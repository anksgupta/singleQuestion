// Directive which dynamically creates form fields based on the input
mainApp.directive('generateField', ['myConfig', '$compile', function(myConfig, $compile) {
		return {
			restrict: 'E',
			scope: {
				fieldType: '@',
				user: '=',
				field: '='
			},
			link: function (scope, element, attrs) {
				var template = "<" + myConfig.templateConfig[scope.fieldType] + " user='user' field='field'></" + myConfig.templateConfig[scope.fieldType] + ">";
				element.append($compile(template)(scope))
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
					if(eventsArr.length > 0){$rootScope.$emit(eventsArr[0])}
				});
				elem.ready(function(){
					$rootScope.$emit(eventsArr[0])
					// need to check alternative. remove apply and check the timing issue - WP,HP watchers not getting fired on elem.ready()
					scope.$apply();
				});
				
			}
		}
}])

// Home phone directive
mainApp.directive("phoneField", ['TcpaService', 'NotificationService', '$rootScope', function(TcpaService, NotificationService, $rootScope){
	return {
		restrict: 'E',
		replace: true,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-switch="field.is_single_col">' +
					'<div ng-switch-when="true"><input name="{{field.name}}" type="tel" maxlength="" placeholder="" ng-model="singlePhoneNumber.value"/></div>' +
					'<div ng-switch-when="false">' +
						'<input id="{{field.name}}_AREA" name="{{field.name}}_AREA" type="tel" maxlength="3" placeholder="" ng-model="area.value"/>' +
						'<input id="{{field.name}}_PREFIX" name="{{field.name}}_PREFIX" type="tel" maxlength="3" placeholder="" ng-model="prefix.value"/>' +
						'<input id="{{field.name}}_NUMBER" name="{{field.name}}_NUMBER" type="tel" maxlength="4" placeholder="" ng-model="number.value"/>' +
					'</div>' +
			    '</div>',
		link: function(scope, element, attrs){
			// Check the implementation for $watch. It dosesn't fire when we watch a primitive value inside a directive. We have implemented a work around at the moment. Need to revisit this implementation.
			NotificationService.subscribe('repeatComplete', function(event, args){
				var fieldName = scope.field.name, prefixElem, numberElem;
				if(scope.field.is_single_col){
					scope.singlePhoneNumber = {};
						scope.singlePhoneNumber.value = scope.user[fieldName].value[fieldName + "_AREA"] + 
										scope.user[fieldName].value[fieldName + "_PREFIX"] +
										scope.user[fieldName].value[fieldName + "_NUMBER"];
										
					scope.$watch('singlePhoneNumber.value', function(newValue, oldValue) {
						var phoneNumber = newValue.replace(/[^0-9]/g, '');
						TcpaService.handleTCPA({
								number: phoneNumber, 
								contactMe: true,
								fieldName: fieldName
							}).then(function(){
								NotificationService.notify('repeatComplete');
							});
						scope.user[fieldName].value[fieldName + "_AREA"] = phoneNumber.substring(0, 3);
						scope.user[fieldName].value[fieldName + "_PREFIX"] = phoneNumber.substring(3, 6);
						scope.user[fieldName].value[fieldName + "_NUMBER"] = phoneNumber.substring(6)
					});
				}else {
					scope.area = {value: scope.user[fieldName].value[fieldName + "_AREA"]};
					scope.prefix = {value: scope.user[fieldName].value[fieldName + "_PREFIX"]};
					scope.number = {value: scope.user[fieldName].value[fieldName + "_NUMBER"]};
					
					prefixElem = document.getElementById(fieldName + '_PREFIX');
					numberElem = document.getElementById(fieldName + '_NUMBER');
										
					scope.$watch('[area.value, prefix.value, number.value]', function(newValues, oldValues) {
						var phoneNumber = scope.area.value + scope.prefix.value + scope.number.value;
						TcpaService.handleTCPA({
								number: phoneNumber, 
								contactMe: true,
								fieldName: fieldName
							}).then(function(){
								NotificationService.notify('repeatComplete');
							});
						if (newValues[0] !== oldValues[0] && (newValues[0].length === 3)){ //Check if area is changed & length === maxlength, then move cursor to prefix field
							prefixElem.focus();
						}else if (newValues[1] !== oldValues[1] && (newValues[1].length === 3)){ //Check if prefix is changed & length === maxlength, then move cursor to number field
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
mainApp.directive("homePhoneConsent",['NotificationService', function(NotificationService){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<label class="prompt" for="leadid_tcpa_disclosure">' +
						'<span class="text">{{field.label}}</span>' +
					'</label>' +
					'<div class="ng-hide clear">' +
						'<input id="leadid_tcpa_disclosure" name="HomePhoneConsent" type="text" ng-model="user[field.name].value">' +
					'</div>',
		link: function(scope, element, attrs){
			scope.$on('ShowPhoneConsent', function(event, args){
				if(args.showConsent){
					element.removeClass('ng-hide');
					scope.user['HomePhoneConsent'].value = "Yes"
				}else{
					element.addClass('ng-hide');
					scope.user['HomePhoneConsent'].value = ""
				}
			})
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
		template: '<select name="{{field.name}}" ng-model="user[field.name].value" ng-options="option.value as option.label for option in field.options"><option value="" hidden>-- Select One --</option></select>'
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
		template: '<div ng-switch="field.name"><home-phone-consent class="ng-hide" ng-switch-when="HomePhoneConsent" user="user" field="field"></home-phone-consent><input ng-switch-default name="{{field.name}}" ng-model="user[field.name].value"/></div>',
		link: function(scope, element, attrs){}
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
		template: '<div ng-click="updateModel(field.name, option.value)" ng-class="{myclass: option.value == user[field.name].value}" ng-repeat="option in field.options">{{option.label}}</div>',
		link: function(scope, element, attrs){
			scope.updateModel = function(fieldName, value) {
				if(scope.user[fieldName].value == value)
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
					'<select name="{{field.name}}" ng-model="user[field.name]" ng-options="option.value as option.label for option in field.options"></select>' + 
				'</div>',
	    link: function(scope, element, attrs) {
			var fieldName = scope.field.name;
			scope.updateModel = function(value) {
				if(scope.user[fieldName].value == value)
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

mainApp.directive('cbq', ['CBQService', function(CBQService){
	return {
		restrict: 'A',
		scope: {
			fieldname: '=',
			field: '=',
			user: '=',
			cbqCriteriaObj: '='
		},
		link: function link(scope, element, attrs) {
			scope.postDataObj = {};
			angular.forEach(scope.cbqCriteriaObj[scope.fieldname].p, function(parent){
				scope.$watchCollection(function(){return scope.user[parent]}, function(newValue, oldValue) {
					CBQService.getCBQData(scope.fieldname)
						.then(function(data){
							data ? element.removeClass('ng-hide') : element.addClass('ng-hide');
						}, function(data){
							console.log('ajax failed - promise rejected')
							false ? element.removeClass('ng-hide') : element.addClass('ng-hide');
						})
				});
			});
	    }
	}
}]);

// SingleQuestion directive
mainApp.directive('singleQuestionDirective',['$rootScope', 'SingleQuestion', 'SingleQStepVisibilityService' ,'NotificationService', function($rootScope, SingleQuestion, SingleQStepVisibilityService, NotificationService) {
	return {
        restrict: 'E',
        scope: {
			user: '=',
			singleQuestionOptions: '='
		},
		template: '<a href="javascript:;" id="backBtn" ng-click="showPrevious();">Back</a>' +
				'<button id="nextBtn" ng-click="showNext();">Next</button>' +
				'<button id="submitBtn" ng-click="">Submit</button>' +
				'<div class="rail"><div class="inner_rail"><div class="bar" ng-style="{\'width\': progressBarWidth + \'%\'}"></div></div></div>',
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
			
			scope.showNext = function(){
				SingleQuestion.showNext()
			};
			
			scope.showPrevious = function(){
				SingleQuestion.showPrevious()
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
				SingleQuestion.init(scope.singleQuestionOptions);
				for(var i = 0;i < SingleQuestion.order.length; i++){
					var step = SingleQuestion.order[i];
					for(var j = 0;j < step.length; j++){
						scope.$watch('user.' + step[j] + '.value', function(newValue, oldValue) {
							if(newValue !== oldValue && SingleQuestion.getCBQVisibleFieldObj().length === 1){
								// if current order has only one field visible then call ShowNext on change of model update
								SingleQuestion.showNext()
							}
						});
					}			
				}
			});
        }
    }      
}]);