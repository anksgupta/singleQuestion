/*
 *	1. Use one-time-binding(::)(One-time expressions will stop recalculating once they are stable, which happens after the first digest cycle) for variables whose value remains the same for the entire lifecycle. We haven't used :: for form elements as the field options are shown/hidden dynamically in case of CBA.
 * 2. Implement one way binding where data will be passed only from model to the view(use ng-bind in place of {{}}).
 * 3. If you don't un-register the event bound using $on, you will get a memory leak, as the function you pass to $on will not get cleaned up (as a reference to it still exists). More importantly, any variables that function references in its scope will also be leaked. This will cause your function to get called multiple times if your controller gets created/destroyed multiple times in an application
 *		-	The $on method returns a function which can be called to un-register the event listener. You will want to save your de-register function as a variable for later use: var cleanUpFunc = $scope.$on('yourevent', ...);
 *		-	Whenever a scope gets cleaned up in Angular (i.e. a controller gets destroyed) a $destroy event is fired on that scope. You can register to $scope's $destroy event and call your cleanUpFunc from that.
 * 4. Cancel the timers as well inside $destroy.
*/

// Directive which dynamically creates form fields based on the input type
mainApp.directive('generateField', ['MyConfig', '$compile', 'RouterService', function(MyConfig, $compile, RouterService) {
		return {
			restrict: 'E',
			scope: {
				fieldType: '@',
				user: '=',
				field: '='
			},
			link: function (scope, element, attrs) {
				var fieldSpecificDirective, template, commonDirective, pageName = RouterService.getRouteData().page_name,
				templateConfig = MyConfig.TEMPLATE_CONFIG[pageName][scope.fieldType] ? MyConfig.TEMPLATE_CONFIG[pageName][scope.fieldType] :
									MyConfig.TEMPLATE_CONFIG['common'][scope.fieldType];
				if(typeof templateConfig !== 'undefined' && typeof templateConfig.fieldDirective !== 'undefined') {
					template = "<" + templateConfig.fieldDirective + " user='user' field='field'";
					
					fieldSpecificDirective = templateConfig['fieldSpecificDirective'];
					for(var key in fieldSpecificDirective) {
						var elements = key.split(',');
						if(elements.indexOf(scope.field.name) > -1) {
							template += ' ' + templateConfig['fieldSpecificDirective'][key].split(',').join(' ')
						}
					}
					
					if(templateConfig[scope.fieldType + 'CommonDirective']) {
						template += ' ' + templateConfig[scope.fieldType + 'CommonDirective'].split(',').join(' ');
					}
					
					template += "></" + templateConfig.fieldDirective + ">";
					element.append($compile(template)(scope));
					// Remove the watchers as we need not watch any variable in this directive once it has complied.
					scope.$$watchers = []
				}
			}
		}
}]);

// Directive that watches for changes in the user object & broadcasts the changed attr so that we need not bind watchers on user object in different directives.
mainApp.directive('watchUserObj', ['$rootScope', 'NotificationService', function($rootScope, NotificationService) {
		return {
			restrict: 'E',
			scope: {
				user: '='
			},
			link: function (scope, element, attrs) {
				NotificationService.subscribe('watchUserObj', function(event, args){
					for(var key in scope.user) {
						(function(key){
							scope.$watch('user.' + key + '.value', function(newValue, oldValue) {
								$rootScope.$emit('fieldValueChanged', {
									field: key,
									newValue: newValue,
									oldValue: oldValue
								})
							}, true);
						}(key))
					}
					NotificationService.notify('watchUserObj')
				})
			}
		}
}]);

// Tracking Directive 
mainApp.directive('tracker', ['TrackingService', 'MyConfig', '$rootScope', 'NotificationService', 'UserDataService', function(TrackingService, MyConfig, $rootScope, NotificationService, UserDataService) {
		return {
			restrict: 'E',
			link: function (scope, element, attrs) {
				var textFieldValueMap = {}, cleanUpFunc1;
				NotificationService.subscribe('repeatComplete', function(event, args){
					cleanUpFunc1 = $rootScope.$on('fieldValueChanged', function(event, args){
						// Check if the values are different and CBQ_NOT_SHOWN is not present in any of the values and call tracking service only for fields other than text fields. For text fields, cache the values.
						if(!angular.equals(args.newValue, args.oldValue) && JSON.stringify(args.newValue).indexOf(MyConfig.CBQ_NOT_SHOWN) === -1) {
							if(MyConfig.textTypes.indexOf(UserDataService.getFieldType(args.field).toLowerCase()) > -1) {
								// The if condition is for the below use case:
								// For text fields(like single phonefields), consider the below scenario:
								// The prev value is 650-578-6496 & user modifies the value to 650-57. In this case, ideally these values should be the old & new values respectively. If the below condition is not added, then the new & old values are 650-57 & 650-578 coz model will be updated on every keyup.
								if(textFieldValueMap[args.field] && textFieldValueMap[args.field].args.oldValue) {
									// angular.copy is used to handle objects
									args.oldValue = angular.copy(textFieldValueMap[args.field].args.oldValue)
								}
								textFieldValueMap[args.field] = {args: args, modified: true}
								// modified flag ensures that if value is not changed but blur is called(user might focus the text field & blur the field withour changing its value), then the same value is not tracked again & again.
							} else {
								fireTracker(args)
							}
						}
					});
					NotificationService.notify('repeatComplete')
				});
				
				function fireTracker(args) {
					var log = {};
					// If newValue & oldValue are objects, then log those fields whose values have changed.
					if(typeof args.newValue === 'object' && typeof args.oldValue === 'object') {
						for(var field in args.newValue) {
							if(args.newValue[field] !== args.oldValue[field]) {
								log[field] = args.newValue[field]
							}
						}
					} else {
						log[args.field] = args.newValue
					}
					for(field in log) {
						TrackingService.log({
							eventType: 'elem-change',
							position: field + '_' + log[field]
						})
					}
				}
				
				// Track the text element's value when textValueUpdatedOnBlur is triggered.
				var cleanUpFunc2 = $rootScope.$on('textValueUpdatedOnBlur', function(event, args){
					if(textFieldValueMap[args.field] && textFieldValueMap[args.field].modified) {
						fireTracker(textFieldValueMap[args.field].args);
						// Set the modified flag to false to ensure that the same value is not tracked again & again.
						textFieldValueMap[args.field].modified = false;
						// angular.copy is used to handle objects.
						textFieldValueMap[args.field].args.oldValue = angular.copy(textFieldValueMap[args.field].args.newValue)
					}
				});
				
				scope.$on('$destroy', function() {
					cleanUpFunc1();
					cleanUpFunc2()
				});
			}
		}
}]);

// QS.Xapi_Values Directive 
mainApp.directive('xapiValues', ['$rootScope', 'MyConfig', 'NotificationService', function($rootScope, MyConfig, NotificationService) {
		return {
			restrict: 'E',
			replace: true,
			link: function (scope, element, attrs) {
				var xapiAttrMap = {}, xapiMetaTag = document.getElementsByName('QS.Xapi_Values')[0], content, cleanUpFunc;
				
				if(xapiMetaTag) {
					content = xapiMetaTag.getAttribute('content') ? JSON.parse(xapiMetaTag.getAttribute('content')) : {};
					NotificationService.subscribe('repeatComplete', function(event, args){
						cleanUpFunc = $rootScope.$on('fieldValueChanged', function(event, args){
							var elemName;
							// Stop if 'NA' is present in the xapiAttrMap for a particular attribute.
							if(xapiAttrMap[args.field] !== 'NA' && !angular.equals(args.newValue, args.oldValue)
								&& args.newValue && args.newValue !== MyConfig.CBQ_NOT_SHOWN) {
								if(xapiAttrMap[args.field]){ // If data attr is present then fetch its value
									elemName = xapiAttrMap[args.field]
								} else { // If not then iterate over the xengine map and add the data attr so that the next time there is no need to iterate
									for(var xengineAttr in MyConfig.xengineAttributeMap) {
										if(MyConfig.xengineAttributeMap[xengineAttr].indexOf(args.field) > -1){
											elemName = xengineAttr;
											xapiAttrMap[args.field] = elemName
											break
										}
									}
								}
								// Store the value 'NA' against a particular attribute if it is not present in the xengineAttributeMap.
								if(!elemName) {
									xapiAttrMap[args.field] = 'NA'
								} else if(!angular.equals(content[elemName], args.newValue)) {
									if(elemName === 'AreaOfInterest'){
										HttpService.getData('/taxonomyNode.do', {AreaOfInterest: args.newValue}).then(function(json){
											content[elemName] = args.newValue;
											xapiMetaTag.setAttribute('content', JSON.stringify(content))
										}, function(json){
											content[elemName] = args.newValue;
											xapiMetaTag.setAttribute('content', JSON.stringify(content))
										})
									} else {
										content[elemName] = args.newValue;
										xapiMetaTag.setAttribute('content', JSON.stringify(content))
									}
								}
							}
						});
						NotificationService.notify('repeatComplete')
					})
				}
				
				scope.$on('$destroy', function() {
					if(typeof cleanUpFunc === 'function') {
						cleanUpFunc()
					}
				});
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
			template: '<div id="{{::slId}}" class="cachedWidget qs-listings"></div>',
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

// Directive which emits an event after ng-repeat has executed.
mainApp.directive('repeatComplete', ['$rootScope', '$timeout', function($rootScope, $timeout) {
		return {
			restrict: 'A',
			link: function(scope, elem, attrs) {
				var eventsArr, cleanUpFunc;
				if(scope.$last) {
					eventsArr = attrs.repeatComplete.split(',');
					cleanUpFunc = $rootScope.$on('eventNotified', function(event, args){
						eventsArr.splice(0, 1);
						if(eventsArr.length > 0){
							$rootScope.$emit(eventsArr[0])
						}
					});
					// Emit the first event if this is the last element.
					// $timeout makes sure it's executed when the ng-repeated elements have REALLY finished rendering (because the $timeout will execute at the end of the current digest cycle -- and it will also call $apply internally)
					$timeout(function () {
						$rootScope.$emit(eventsArr[0])
					});
					
					scope.$on('$destroy', function() {
						cleanUpFunc()
					});
				}
			}
		}
}]);


// Common select field directive for select fields & ProgramOfInterest question.
mainApp.directive('selectField', [function() {
		return {
			restrict: 'E',
			scope: {
				user: '=',
				field: '='
			},
			template: '<select ng-if="::optGroupItems" name="qs-{{::field.name}}" ng-model="user.value">' +
							'<option value="" hidden>-- Select One --</option>' +
							'<optgroup ng-repeat="(groupName, items) in ::optGroupItems" label="{{::groupName}}" ng-class="::{child: items.is_qual}">' +
								'<option ng-repeat="item in ::items.options" value="{{::item.value}}">{{::item.label}}</option>' +
							'</optgroup>' +
						'</select>' +
						'<select ng-if="::!optGroupItems" name="qs-{{::field.name}}" ng-model="user.value" ng-options="option.value as option.label for option in field.options track by option.value">' + '<option value="" hidden>-- Select One --</option></select>' +
						'<field-actual-value field-name="{{::field.name}}" field-value="{{user.value}}"></field-actual-value>',
			link: function (scope, element, attrs) {
				// optGroupName keeps track of all the options that fall under a particular optgroup.
				var optGroupName;
				scope.optGroupItems = {};
				// If no group is found, then optGroupItems will always be se to null.
				for(var i = 0; i < scope.field.options.length; i++) {
					// For POI, by default the first option has is_group flag set to true.
					// If the first option doesn't have is_group flag, then we assume that this is a normal select field.
					if(scope.field.options[i].is_group) {
						// Create an object containing the optgroup label as key & an object containing is_qual flag and options array as the value.
						scope.optGroupItems[scope.field.options[i].label] = {
							is_qual: scope.field.options[i].is_qual,
							options: []
						};
						optGroupName = scope.field.options[i].label
					} else if(optGroupName) {
						// Add the option to a particular group iff optGroupName is set.
						scope.optGroupItems[optGroupName].options.push(scope.field.options[i])
					} else {
						// This else loop will execute for normal select fields as in such cases is_group won't be present & optGroupName will be undefined.
						scope.optGroupItems = null;
						break
					}
				}
			}
		}
}]);

// Radio button directive
mainApp.directive("radioInTable", [function(){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-click="updateModel(field.name, option.value)" ng-class="{myclass: option.value == user.value}" ng-repeat="option in ' + 'field.options track by option.value">{{::option.label}}</div><field-actual-value field-value="{{user.value}}" field-name="{{::field.name}}"></field-actual-value>',
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		link: function(scope, element, attrs, controller){
			scope.updateModel = function(fieldName, value) {
				scope.user.value = value;
            }
		}
	}
}]);

// Common date field directive
mainApp.directive('dateField', ['NotificationService', function(NotificationService) {
		return {
			restrict: 'E',
			replace: true,
			// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
			priority: 1,
			scope: {
				user: '=',
				field: '='
			},
			// Add the controller so that it can be shared with other directives added as attributes on this directive.
			controller: ['$scope', function($scope){}],
			template: '<span ng-repeat="format in ::formatStr">' +
						'<span class="date" ng-if="::(format === \'DD\')">' +
							'<label for="{{::field.name}}_DATE">DD</label>' +
							'<input id="{{::field.name}}_DATE" ng-model="user.value[field.fieldNames.DD]" class="date" maxlength="2" name="qs-{{::field.name}}_DATE" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_DATE" field-value="{{user.value[field.fieldNames.DD]}}"></field-actual-value>' +
						'</span>' +
						'<span class="month" ng-if="::(format === \'MM\')">' +
							'<label for="{{::field.name}}_MONTH">MM</label>' +
							'<input id="{{::field.name}}_MONTH" ng-model="user.value[field.fieldNames.MM]" class="month" maxlength="2" name="qs-{{::field.name}}_MONTH" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_MONTH" field-value="{{user.value[field.fieldNames.MM]}}"></field-actual-value>' +
						'</span>' +
						'<span class="year" ng-if="::(format === \'YYYY\')">' +
							'<label for="{{::field.name}}_YEAR">YYYY</label>' +
							'<input id="{{::field.name}}_YEAR" ng-model="user.value[field.fieldNames.YYYY]" class="year" maxlength="4" name="qs-{{::field.name}}_YEAR" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_YEAR" field-value="{{user.value[field.fieldNames.YYYY]}}"></field-actual-value>' +
						'</span>' +
					'</div>',
			link: function (scope, element, attrs) {
				var valueArray = scope.field.value.split('/');
				scope.user.value = {}, scope.formatStr = 'MM-DD-YYYY', fieldMapArr = [];
				// If we set fieldNames as a property of the scope object, then it is not accessible inside the ng-repeat directive. So we have set it as a property of the field object. Not sure as to why fieldNames is accessible if we set it as a property of the field object.
				scope.field.fieldNames = {
					DD: (scope.field.name + '_DATE'),
					MM: (scope.field.name + '_MONTH'),
					YYYY: (scope.field.name + '_YEAR')
				};
				
				// We'll have to keep a single delimiter in the format.
				if(scope.field.format) {
					scope.formatStr = scope.field.format.replace(/\//g, '-')
				}
				scope.formatStr = scope.formatStr.split('-');
				
				for(var i = 0; i < scope.formatStr.length; i++) {
					scope.user.value[scope.field.fieldNames[scope.formatStr[i]]] = (valueArray[i] ? valueArray[i] : '');
					fieldMapArr.push(scope.field.fieldNames[scope.formatStr[i]])
				}
				
				// Set focus
				NotificationService.subscribe('repeatComplete', function(event, args){
					for(var key in scope.user.value) {
						var currElem = document.getElementById(key),
							nextElem = fieldMapArr[fieldMapArr.indexOf(key) + 1] ? document.getElementById(fieldMapArr[fieldMapArr.indexOf(key) + 1]) : null;
						(function(key, currElem, nextElem){
							scope.$watch('user.value.' + key, function(newValue, oldValue) {
								if(newValue !== oldValue && nextElem && newValue.length === currElem.maxLength) {
									nextElem.focus()
								}
							}, true);
						}(key, currElem, nextElem))
					}
					NotificationService.notify('repeatComplete')
				});
			}
		}
}]);

// Home phone directive
mainApp.directive("phoneField", ['TcpaService', 'NotificationService', 'UserDataService', '$rootScope', '$timeout', function(TcpaService, NotificationService, UserDataService, $rootScope, $timeout){
	return {
		restrict: 'E',
		replace: true,
		// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div>' +
					'<div ng-if="::field.is_single_col"><input text-field-blur name="qs-{{::field.name}}" type="tel" maxlength="" placeholder="" ng-model="singlePhoneNumber.value"/><field-actual-value field-name="{{::field.name}}" field-value="{{formattedNo}}"></field-actual-value></div>' +
					'<div ng-if="::!field.is_single_col">' +
						'<input id="{{::field.name}}_AREA" text-field-blur name="{{::field.name}}_AREA" type="tel" maxlength="3" placeholder="" ng-model="area.value"/>' +
						'<input id="{{::field.name}}_PREFIX" text-field-blur name="{{::field.name}}_PREFIX" type="tel" maxlength="3" placeholder="" ng-model="prefix.value"/>' +
						'<input id="{{::field.name}}_NUMBER" text-field-blur name="{{::field.name}}_NUMBER" type="tel" maxlength="4" placeholder="" ng-model="number.value"/>' +
						'<div>' +
							'<field-actual-value field-name="{{::field.name}}_AREA" field-value="{{area.value}}"></field-actual-value>' +
							'<field-actual-value field-name="{{::field.name}}_PREFIX" field-value="{{prefix.value}}"></field-actual-value>' +
							'<field-actual-value field-name="{{::field.name}}_NUMBER" field-value="{{number.value}}"></field-actual-value>' +
						'</div>' +
					'</div>' +
			    '</div>',
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		link: function(scope, element, attrs, controller){
			// Check the implementation for $watch. It dosesn't fire when we watch a primitive value inside a directive. We have implemented a work around at the moment. Need to revisit this implementation.
			NotificationService.subscribe('repeatComplete', function(event, args){
				var fieldName = scope.field.name, prefixElem, numberElem;
				if(scope.field.is_single_col) {
					// Bind the singlePhoneNumber to the controller so that is can be accessed in other directives added as attributes on this directive.
					controller.singlePhoneNumber = scope.singlePhoneNumber = {};
					scope.singlePhoneNumber.value = scope.user.value[fieldName + "_AREA"] + 
										scope.user.value[fieldName + "_PREFIX"] +
										scope.user.value[fieldName + "_NUMBER"],
					scope.formattedNo = '';
										
					scope.$watch('singlePhoneNumber.value', function(newValue, oldValue) {
						scope.formattedNo = newValue.replace(/[^0-9]/g, ''),
							contactMe = UserDataService.getUserData('ContactMe');
						TcpaService.handleTCPA({
								number: scope.formattedNo, 
								contactMe: (contactMe.indexOf(null) > -1) ? false : contactMe.join(''),
								fieldName: fieldName
							}).then(function(){
								NotificationService.notify('repeatComplete');
							});
						scope.user.value[fieldName + "_AREA"] = scope.formattedNo.substring(0, 3);
						scope.user.value[fieldName + "_PREFIX"] = scope.formattedNo.substring(3, 6);
						scope.user.value[fieldName + "_NUMBER"] = scope.formattedNo.substring(6);
						
						$rootScope.$emit('singlePhoneFieldUpdated', {newValue: newValue})
					}, false);
				} else {
					scope.area = {value: scope.user.value[fieldName + "_AREA"]};
					scope.prefix = {value: scope.user.value[fieldName + "_PREFIX"]};
					scope.number = {value: scope.user.value[fieldName + "_NUMBER"]};
					
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
						
						scope.user.value[fieldName + "_AREA"] = newValues[0];
						scope.user.value[fieldName + "_PREFIX"] = newValues[1];
						scope.user.value[fieldName + "_NUMBER"] = newValues[2];
						
						if (newValues[0] !== oldValues[0] && (newValues[0].length === 3)){ // Check if area is changed & length === maxlength, then move cursor to prefix field
							prefixElem.focus()
						}else if (newValues[1] !== oldValues[1] && (newValues[1].length === 3)){ // Check if prefix is changed & length === maxlength, then move cursor to number field
							numberElem.focus()
						}
					}, false);
				}
			});
		}
	}
}]);

// TCPA directive
mainApp.directive("homePhoneConsent",['UserDataService', 'TcpaService', '$rootScope', function(UserDataService, TcpaService, $rootScope){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		template: '<div ng-if="::(field.type === \'Text\')">' +
						'<label>' + 
							// don't use ng-model and only use value attribute so LeadId script can read the field
							// ng-model will set value property and not the attribute
							'<input class="ng-hide" id="leadid_tcpa_disclosure" name="HomePhoneConsent" type="text" value="{{user.value}}">' + 
							'<span>{{::field.label}}</span>' + 
						'</label>' + 
					'</div>' + 
					'<div ng-if="::(field.type === \'Checkbox\')">' + 
						'<label ng-repeat="option in ::field.options">' + 
							/* For checkbox case, LeadID will read value only if checkbox is checked.
							   In case checked attribute is set using javascript, Passive consent issue may occur from LeadID
							   so we've used ng-if to show/hide HTML input with checked attribute */ 
							'<input ng-if="isChecked == option.value" name="HomePhoneConsent" type="checkbox" checked value="{{::option.value}}" ng-model="user.value" ng-change="setValue()" ng-true-value="\'{{::option.value}}\'" ng-false-value="\'\'"/>' + 
							'<input ng-if="isChecked != option.value" name="HomePhoneConsent" type="checkbox" value="{{::option.value}}" ng-model="user.value" ng-change="setValue()" ng-true-value="\'{{::option.value}}\'" ng-false-value="\'\'"/>' + 
							'<span>{{::option.label}}</span>' + 
						'</label>' + 
					'</div>',
		link: function(scope, element, attrs, controller){
			// HomePhoneConsent field is hidden/shown coz of ng-hide class(!important).
			var cleanUpFunc = $rootScope.$on('ShowPhoneConsent', function(event, args){
				var consentContainer = document.getElementById('input-HomePhoneConsent');
				if(consentContainer)
					angular.element(consentContainer)[(args.showConsent ? 'remove' : 'add') + 'Class']('ng-hide')
				
				UserDataService.setIsVisible('HomePhoneConsent', args.showConsent);
				
				if(scope.field.type !== 'Checkbox') {
					scope.user.value = (args.showConsent ? 'Yes' : '')
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
				scope.isChecked = scope.user.value;
				scope.setValue = function(){
					scope.isChecked = scope.user.value;
				}
			}
			
			scope.$on('$destroy', function() {
				cleanUpFunc()
			});
		}
	}
}]);

// Phonefield placeholder Directive 
mainApp.directive('placeHolder', ['NotificationService', 'UserDataService', '$rootScope', function(NotificationService, UserDataService, $rootScope) {
		return {
			restrict: 'A',
			// Set a priority higher than phoneField so that it's link function is executed after phoneField's link function.
			priority: 2,
			require: "phoneField", // To access phoneField's controller, we have to pass the 'require' parameter
			link: function (scope, element, attrs, phoneCtrl) {
				// phoneCtrl is phoneField's controller. We use it to access the singlePhoneNumber object.
				var cleanUpFunc;
				if(scope.field.is_single_col) {
					NotificationService.subscribe('repeatComplete', function(event, args){
						// Listen for singlePhoneFieldUpdated event and format the phone number using phonefield's controller so that the original object is updated as well.
						cleanUpFunc = $rootScope.$on('singlePhoneFieldUpdated', function(event, args){
							if(args.newValue) {
								newValue = args.newValue.replace(/[^0-9]/g, '');
								
								area = newValue.substring(0, 3);
								prefix = newValue.substring(3, 6);
								number = newValue.substring(6);
								phoneCtrl.singlePhoneNumber.value = ((area.length === 3 ? '(' + area : area) + (prefix.length > 0 ? ') ' + prefix : '') + (number.length > 0 ? '-' + number : ''))
							}
						});
						NotificationService.notify('repeatComplete')
					});
				}
				
				scope.$on('$destroy', function() {
					if(typeof cleanUpFunc === 'function') {
						cleanUpFunc()
					}
				});
			}
		}
}]);

// HomePhoneConsent field can be of type textbox as well as checkbox. The below directive handles text, checkbox & HomePhoneConsent field directives
mainApp.directive("generateFieldByType", [function(){
	return {
		restrict: 'E',
		scope: {
			user: '=',
			field: '='
		},
		template: '<generate-field ng-if="::(field.name === \'HomePhoneConsent\')" field-type="HomePhoneConsent" user="user" field="field"></generate-field>' 			+ '<generate-field ng-if="::(field.name !== \'HomePhoneConsent\')" field-type="Actual{{::field.type}}" user="user" field="field"></generate-field>'
	}
}]);

// Text field directive
mainApp.directive("textField", [function(){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		// ng-model-options are passed so that model will be updated only when the focus is lost.
		template: 
			'<div>' + 
				'<input name="qs-{{::field.name}}" text-field-blur ng-model="user.value"/>' + 
				'<field-actual-value field-name="{{::field.name}}" field-value="{{user.value}}"></field-actual-value>' + 
			'</div>',
		link: function(scope, element, attrs, controller){}
	}
}]);

// Text field blur directive
mainApp.directive("textFieldBlur", ['$rootScope', function($rootScope){
	return {
		restrict: 'A',
		link: function(scope, element, attrs){
			element.on('blur', function(event) {
				// Broadcast textValueUpdatedOnBlur event which is handled in the tracker directive.
				$rootScope.$emit('textValueUpdatedOnBlur', {field: scope.field.name})
			});
		}
	}
}]);

// Checkbox field directive
mainApp.directive("checkboxField", [function(){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		template: '<div>' + 
					'<label ng-repeat="option in field.options track by option.value">' + 
						'<input type="checkbox" name="qs-{{::field.name}}" ng-true-value="\'{{::option.value}}\'" ng-false-value="\'\'" ng-change="setValue(option)" ng-model="option.checked"/>' + 
						'<span>{{::option.label}}</span>' + 
					'</label>' + 
					'<field-actual-value field-name="{{::field.name}}" field-value="{{user.value}}"></field-actual-value>' + 
				'</div>',
		link: function(scope, element, attrs, controller){
			var values = scope.user.value.split(',');
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
				values = scope.user.value.split(',');
				if(option.checked && values.indexOf(option.value) === -1){
					values.push(option.value)
				}else if(!option.checked && values.indexOf(option.value) > -1){
					values.splice(values.indexOf(option.value), 1)
				}
				
				scope.user.value = values.join(',')
			}
		}
	}
}]);

// Directive that renders a text field which holds the actual value stored in the model of any field. We use this for leadid tracking.
mainApp.directive("fieldActualValue", [function(){
	return {
		restrict: 'E',
		replace: true,
		scope: {
			fieldName: '@',
			fieldValue: '@'
		},
		template: '<input name="{{::fieldName}}" type="text" style="display: none;" data-leadid="true" value="{{::fieldValue}}">'
	}
}]);

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
                        // only reach this code *after* the '$compile()'
                        // call above has returned.
                        compileGuard = 0;

                    }
                };
            }
        };
}]);

// CBQ directive to handle criteria on contact & increment pages
mainApp.directive('cbq', ['UserDataService', 'CBQService', '$rootScope', function(UserDataService, CBQService, $rootScope){
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			var criteriaObj = UserDataService.getFieldCriteria(attrs.fieldname), cleanUpFunc;
			if(criteriaObj) {
				cleanUpFunc = $rootScope.$on('fieldValueChanged', function(event, args){
					if(criteriaObj.p.indexOf(args.field) > -1){
						CBQService.getCBQData(attrs.fieldname)
							.then(function(data){
								element[(data ? 'remove' : 'add') + 'Class']('ng-hide');
								UserDataService[(data ? 'clear': 'set') + 'CbqNotShown'](attrs.fieldname);
								UserDataService.setIsVisible(attrs.fieldname, data)
							}, function(data){
								console.log('ajax failed - promise rejected')
								false ? element.removeClass('ng-hide') : element.addClass('ng-hide');
							})
					}
				});
			}
			
			scope.$on('$destroy', function() {
				if(typeof cleanUpFunc === 'function') {
					cleanUpFunc()
				}
			});
	    }
	}
}]);

/**
*	@params
*	validateBeforeSubmit: Contains reference to a function which you want to execute before form is submitted.
*	emittedEvent: If you want to manually submit a form, then pass the eventname to this directive. When this event is emitted, the form will be submitted. One scenario is the auto submit case in singlequestion.
*/
mainApp.directive('submitBtn', ['HttpService', '$rootScope', 'UserDataService', 'RouterService', function(HttpService, $rootScope, UserDataService, RouterService){
	return {
		restrict: 'E',
		scope: {
			text: '@',
			validateBeforeSubmit: '&?',
			emittedEvent: '@',
			url: '@'
		},
		template: '<button id="submitBtn" ng-click="submit()">' + 
					'<span>{{::text}}</span>' +
					'<span class="processing">Processing...</span></button>',
		link: function link(scope, element, attrs) {
			var url = scope.url ? ('/' + scope.url.replace(/.do|\//, '') + '.do') : (RouterService.getRouteData().page_name + '.do'),
				validateBeforeSubmit = (typeof scope.validateBeforeSubmit === 'function') ? scope.validateBeforeSubmit : UserDataService.validateFields,
				cleanUpFunc;
			function submitForm(){
				HttpService.getData(url, UserDataService.getFinalUserData()).then(function(json){
					RouterService.navigate(json)
				}, function(json){
					RouterService.navigate(json)
				})
			}
			
			scope.submit = function() {
				validateBeforeSubmit().then(function(result){
					if(result)
						submitForm()
				})
            };
			
			if(scope.emittedEvent){
				cleanUpFunc = $rootScope.$on(scope.emittedEvent, function(event, args){
					scope.submit()
				});
			}
			
			scope.$on('$destroy', function() {
				if(typeof cleanUpFunc === 'function') {
					cleanUpFunc()
				}
			});
	    }
	}
}]);

// SingleQuestion directive
mainApp.directive('singleQuestionDirective',['$rootScope', 'SingleQuestion', 'SingleQStepVisibilityService', 'NotificationService', 'MyConfig', 'RouterService', 'UserDataService', function($rootScope, SingleQuestion, SingleQStepVisibilityService, NotificationService, MyConfig, RouterService, UserDataService) {
	return {
        restrict: 'E',
        scope: {
			singleQuestionOptions: '='
		},
		// The parenthesis after isValidSingleQuestionStep is V.V.V.V.V.V.V.V.V.V Imp. Without the parenthesis, the function we pass will never get called.
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
			var cleanUpFunc3, typesToIgnore = 'text|checkbox|date|phoneformat', 
				nextBtnElem = angular.element(document.getElementById('nextBtn')), 
				backBtnElem = angular.element(document.getElementById('backBtn')), 
				submitBtn= angular.element(document.getElementById('submitBtn')),
				showNextBtn = function(){
					nextBtnElem.addClass('ng-hide');
					if(SingleQuestion.current !== SingleQuestion.order.length - 1){
						var step = SingleQuestion.order[SingleQuestion.current];
						/** Next button should be shown:
							- if multiple visible fields are present in Step
							- else if single field is present and it is present in typesToIgnore
							- else if current Step is valid
						*/
						if(SingleQuestion.getCBQVisibleFieldObj().length > 1){
							nextBtnElem.removeClass('ng-hide')
						} else if(typesToIgnore.indexOf(SingleQuestion.getCBQVisibleFieldObj()[0].type) !== -1 ) {
							nextBtnElem.removeClass('ng-hide')
						} else{
							SingleQuestion.isValidSingleQuestionStep({setErrorMsg: false}).then(function(result){
								result ? nextBtnElem.removeClass('ng-hide') : nextBtnElem.addClass('ng-hide');
							});
						}
					}
				};
			
			var cleanUpFunc1 = $rootScope.$on('currentUpdated', function(event, args){
				// update current and validate next step
				showNextBtn();
				SingleQStepVisibilityService.showHideStep({
						stepDirection: args.stepDirection,
						elementsToHide: args.elementsToHide,
						elementsToShow: args.elementsToShow
					});
				(SingleQuestion.current === SingleQuestion.order.length - 1) ? submitBtn.removeClass('ng-hide') : submitBtn.addClass('ng-hide');
				(SingleQuestion.current !== 0) ? backBtnElem.removeClass('ng-hide') : backBtnElem.addClass('ng-hide');
				
				scope.progressBarWidth = args.progress
			});
			
			var cleanUpFunc2 = $rootScope.$on('handleRedirectionToTheSamePage', function(event, args){
				// Iterate on the order & set the error_message for all the fields for whom an error is returned from the back end.
				// Also find out the field that has an error and is the last element amongst all the fields having an error. Set this element as the current element.
				var routeData = RouterService.getRouteData(), order = routeData.form.order, errorIndex;
				for(var i = (order.length - 1); i >= 0; i--) {
					for(var j = 0, step; (step = order[i]) && j < step.length; j++) {
						if(routeData.form.fields[step[j]].error_message) {
							UserDataService.setErrorMsg(step[j], routeData.form.fields[step[j]].error_message);
							errorIndex = i
						}
					}
				}
				SingleQuestion.updateCurrentStep('custom', errorIndex)
			});
			
			NotificationService.subscribe('singleQuestionInitialized', function(event, args){
				SingleQuestion.init(scope.singleQuestionOptions).then(function(){
					// Bind watchers only after SingleQuestion init method is resolved.
					cleanUpFunc3 = $rootScope.$on('fieldValueChanged', function(event, args){
						if(!angular.equals(args.newValue, args.oldValue) &&
							SingleQuestion.getCBQVisibleFieldObj().length === 1 &&
							typesToIgnore.indexOf(SingleQuestion.getCBQVisibleFieldObj()[0].type) === -1 &&
							args.newValue !== MyConfig.CBQ_NOT_SHOWN && args.oldValue !== MyConfig.CBQ_NOT_SHOWN){
							// If current order has only one visible field, then call ShowNext on model update.
							SingleQuestion.showNext()
						}
					});
					
					NotificationService.notify('singleQuestionInitialized')
				});
			});
			
			scope.$on('$destroy', function() {
				cleanUpFunc1();
				cleanUpFunc2();
				cleanUpFunc3()
			});
        }
    }      
}]);