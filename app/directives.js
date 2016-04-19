// Home phone directive
mainApp.directive("phoneField", ['TcpaService', function(TcpaService){
	return {
		restrict: 'E',
		replace: true,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-switch="field.is_single_col">' +
					'<input ng-switch-when="true" value="" name="{{field.name}}" type="tel" maxlength="" placeholder="" ng-model="phoneNumber">' +
					'<div ng-switch-when="false">' +
						'<input name="{{field.name}}_AREA" type="tel" maxlength="3" placeholder="" ng-model="area.value">' +
						'<input name="{{field.name}}_PREFIX" type="tel" maxlength="3" placeholder="" ng-model="prefix.value">' +
						'<input name="{{field.name}}_NUMBER" type="tel" maxlength="4" placeholder="" ng-model="number.value">' +
					'</div>' +
			    '</div>',
		link: function(scope, element, attrs){
			if(scope.field.is_single_col){
				scope.phoneNumber = scope.user[scope.field.name + "_AREA"].value + 
									scope.user[scope.field.name + "_PREFIX"].value +
									scope.user[scope.field.name + "_NUMBER"].value;
									
				scope.$watch(phoneNumber, function(newValue, oldValue) {
						TcpaService.handleTCPA(scope.phoneNumber, true);
				});
			}else {
				scope.area = scope.user[scope.field.name + "_AREA"];
				scope.prefix = scope.user[scope.field.name + "_PREFIX"];
				scope.number = scope.user[scope.field.name + "_NUMBER"];
				scope.$watchGroup(['area.value', 'prefix.value', 'number.value'], function(newValue, oldValue) {
						var phoneNumber = scope.area.value + "" + scope.prefix.value + "" + scope.number.value;
						TcpaService.handleTCPA(phoneNumber, true);
				});
			}
		}
	}
}]);

// TCPA directive
mainApp.directive("homePhoneConsent", function(){
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
						'<input id="leadid_tcpa_disclosure" value="{{field.value}}" name="HomePhoneConsent" type="text">' +
					'</div>',
		link: function(scope, element, attrs){
			scope.$on('ShowPhoneConsent', function(event, args){
				args.showConsent ? element.removeClass('ng-hide') : element.addClass('ng-hide');
			})
		}
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
						'<li ng-repeat="option in field.options" value="{{option.value}}" ng-click="updateModel(option.value)" ng-class="{myclass: option.value == user[field.name]}">{{option.label}}</li>'+
					'</ul>'+
					'<select name="{{field.name}}" ng-model="user[field.name]" ng-options="option.value as option.label for option in field.options"></select>' + 
				'</div>',
		controller: ['$scope', function($scope) {
			
	    }],
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
    }
]);

mainApp.directive('cbq', ['CBQService', function(CBQService){
	return {
		restrict: 'A',
		scope: {
			fieldname: '=',
			field: '=',
			user: '=',
			cbqObj: '='
		},
		link: function link(scope, element, attrs) {
			scope.postDataObj = {};
			angular.forEach(scope.cbqObj[scope.fieldname].p, function(parent){
				scope.$watchCollection(function(){return scope.user[parent]}, function(newValue, oldValue) {
					CBQService.getCBQData(scope.fieldname, scope.cbqObj[scope.fieldname])
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
mainApp.directive('singleQuestionDirective',['SingleQuestion', 'AnimationService', function(SingleQuestion, AnimationService) {
	return {
        restrict: 'E',
        scope: {
			singleQuestionOptions: '='
		},
		template: '<a href="javascript:;" id="backBtn" ng-click="SingleQuestion.showPrevious();">Back</a>' +
				'<button id="nextBtn" ng-click="SingleQuestion.showNext();">Next</button>' +
				'<button id="submitBtn" ng-click="singleQuestionOptions.callbacks.submit()">Submit</button>' +
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
						if(SingleQuestion.getVisibleFieldObj().length > 1){
							nextBtnElem.removeClass('ng-hide')
						} else if((SingleQuestion.getVisibleFieldObj()[0].type).toLowerCase() === "text") {
							nextBtnElem.removeClass('ng-hide')
						} else{
							SingleQuestion.isValidSingleQuestionStep().then(function(result){
								result ? nextBtnElem.removeClass('ng-hide') : nextBtnElem.addClass('ng-hide');
							});
						}
					}
				},
				showHideStep = function(elementToHide){
					var currentStep = SingleQuestion.order[SingleQuestion.current];
					// first hide previously active element 
					if(elementToHide.length > 0){
						for(var i = 0; i < elementToHide.length; i++){
							angular.element(document.getElementById('input-' + elementToHide[i])).addClass('ng-hide');
							AnimationService.fadeOut(document.getElementById('input-' + elementToHide[i]), {
								duration: 1000,
								complete: function() {
									console.log('fadeOut');
								}
							});
						}
					}
					// show fields in current order
					for(var i = 0; i < currentStep.length; i++){
						if(SingleQuestion.checkVisibility(currentStep[i])) {
							angular.element(document.getElementById('input-' + currentStep[i])).removeClass('ng-hide');
							AnimationService.fadeIn(document.getElementById('input-' + currentStep[i]), {
								duration: 1000,
								complete: function() {
									console.log('fadeIn');
								}
							});
						}
					}
				}
			
			
			scope.$on('currentUpdated', function(event, args){
				// update current and validate next step
				showNextBtn();
				showHideStep(args ? args.elementToHide : []);
				(SingleQuestion.current === SingleQuestion.order.length - 1) ? submitBtn.removeClass('ng-hide') : submitBtn.addClass('ng-hide');
				(SingleQuestion.current !== 0) ? backBtnElem.removeClass('ng-hide') : backBtnElem.addClass('ng-hide');
				
				scope.progressBarWidth = SingleQuestion.progressBarWidth
			});
			
			scope.SingleQuestion = SingleQuestion.init(scope.singleQuestionOptions);
			
			for(var i=0;i < SingleQuestion.order.length; i++){
				var step = SingleQuestion.order[i];
				for(var j=0;j < step.length; j++){
					scope.$watchCollection(function(){return SingleQuestion.user[step[j]]}, function(newValue, oldValue) {
						if(newValue !== oldValue && SingleQuestion.getVisibleFieldObj().length === 1){
							// if current order has only one field visible then call ShowNext on change of model update
							SingleQuestion.showNext()
						}
					});
				}			
			}
        }
    }      
}]);