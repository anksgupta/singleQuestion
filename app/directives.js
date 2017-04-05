/*
 *	1. Use one-time-binding(::)(One-time expressions will stop recalculating once they are stable, which happens after the first digest cycle) for variables whose value remains the same for the entire lifecycle. We haven't used :: for form elements as the field options are shown/hidden dynamically in case of CBA.
 * 2. Implement one way binding where data will be passed only from model to the view(use ng-bind in place of {{}}).
*/

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
				var templateConfig = MyConfig.TEMPLATE_CONFIG[scope.fieldType], fieldSpecificDirective, template, commonDirective;
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
					element.append($compile(template)(scope))
				}
			}
		}
}]);

// Directive that watches for changes in the user object & broadcasts the changed attr so that we need not bind watchers on user object in different directives.
mainApp.directive('watchUserObj', ['$rootScope', 'NotificationService', function($rootScope, NotificationService) {
		return {
			restrict: 'E',
			scope: {
				user: '=',
				field: '='
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
mainApp.directive('tracker', ['TrackingService', 'MyConfig', '$rootScope', 'NotificationService', function(TrackingService, MyConfig, $rootScope,NotificationService) {
		return {
			restrict: 'E',
			scope: {
				fields: "="
			},
			link: function (scope, element, attrs) {
				var textFieldValueMap = {};
				NotificationService.subscribe('repeatComplete', function(event, args){
					$rootScope.$on('fieldValueChanged', function(event, args){
						// Check if the values are different and CBQ_NOT_SHOWN is not present in any of the values and call tracking service only for fields other than text fields. For text fields, cache the values.
						if(!angular.equals(args.newValue, args.oldValue) && JSON.stringify(args.newValue).indexOf(MyConfig.CBQ_NOT_SHOWN) === -1) {
							if(MyConfig.textTypes.indexOf(scope.fields[args.field].type.toLowerCase()) > -1) {
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
				$rootScope.$on('textValueUpdatedOnBlur', function(event, args){
					if(textFieldValueMap[args.field] && textFieldValueMap[args.field].modified) {
						fireTracker(textFieldValueMap[args.field].args);
						// Set the modified flag to false to ensure that the same value is not tracked again & again.
						textFieldValueMap[args.field].modified = false;
						// angular.copy is used to handle objects.
						textFieldValueMap[args.field].args.oldValue = angular.copy(textFieldValueMap[args.field].args.newValue)
					}
				});
			}
		}
}]);

// QS.Xapi_Values Directive 
mainApp.directive('xapiValues', ['$compile', '$rootScope', 'MyConfig', 'NotificationService', function($compile, $rootScope, MyConfig, NotificationService) {
		return {
			restrict: 'E',
			replace: true,
			scope: {},
			link: function (scope, element, attrs) {
				var template = '<meta name="QS.Xapi_Values" content="{{content}}">', xapiAttrMap = {};

				scope.content = {};
				angular.element(document.querySelector('head')).append(($compile(template)(scope)));
				
				NotificationService.subscribe('repeatComplete', function(event, args){
					$rootScope.$on('fieldValueChanged', function(event, args){
						// Stop if 'NA' is already present in the xapiAttrMap for a particular attribute.
						if(xapiAttrMap[args.field] !== 'NA' && args.newValue && args.newValue !== MyConfig.CBQ_NOT_SHOWN) {
							var elemName;
							if(xapiAttrMap[args.field]){ // If data attr is present then fetch its value
								elemName = xapiAttrMap[args.field]
							}else{ // If not then iterate over the xengine map and add the data attr so that the next time there is no need to iterate
								for(var xengineAttr in MyConfig.xengineAttributeMap){
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
							} else if(scope.content[elemName] !== args.newValue) {
								scope.content[elemName] = args.newValue
							}
						}
					});
					NotificationService.notify('repeatComplete')
				})
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
					// need to check alternative. remove digest and check the timing issue - WP,HP watchers not getting fired on elem.ready()
					scope.$digest();
				});
				
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
			template: '<select ng-if="optGroupItems" name="qs-{{::field.name}}" ng-model="user[field.name].value">' +
							'<option value="" hidden>-- Select One --</option>' +
							'<optgroup ng-repeat="(groupName, items) in ::optGroupItems" label="{{::groupName}}" ng-class="::{child: items.is_qual}">' +
								'<option ng-repeat="item in ::items.options" value="{{::item.value}}" ng-bind="item.label"></option>' +
							'</optgroup>' +
						'</select>' +
						'<select ng-if="!optGroupItems" name="qs-{{::field.name}}" ng-model="user[field.name].value" ng-options="option.value as option.label for option in field.options track by option.value">' + '<option value="" hidden>-- Select One --</option></select>' +
						'<field-actual-value field-name="{{::field.name}}" field-value="{{user[field.name].value}}"></field-actual-value>',
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

// Common date field directive
mainApp.directive('dateField', [function() {
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
			template: '<div ng-repeat="format in ::formatStr">' +
						'<span class="date" ng-if="format === \'DD\'">' +
							'<label for="{{::field.name}}_DATE">DD</label>' +
							'<input id="{{::field.name}}_DATE" ng-model="user[field.name].value[field.fieldNames.date]" class="date" maxlength="2" name="qs-{{::field.name}}_DATE" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_DATE" field-value="{{user[field.name].value[field.fieldNames.date]}}"></field-actual-value>' +
						'</span>' +
						'<span class="month" ng-if="format === \'MM\'">' +
							'<label for="{{::field.name}}_MONTH">MM</label>' +
							'<input id="{{::field.name}}_MONTH" ng-model="user[field.name].value[field.fieldNames.month]" class="month" maxlength="2" name="qs-{{::field.name}}_MONTH" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_MONTH" field-value="{{user[field.name].value[field.fieldNames.month]}}"></field-actual-value>' +
						'</span>' +
						'<span class="year" ng-if="format === \'YYYY\'">' +
							'<label for="{{::field.name}}_YEAR">YYYY</label>' +
							'<input id="{{::field.name}}_YEAR" ng-model="user[field.name].value[field.fieldNames.year]" class="year" maxlength="4" name="qs-{{::field.name}}_YEAR" type="text" text-field-blur/>' +
							'<field-actual-value field-name="{{::field.name}}_YEAR" field-value="{{user[field.name].value[field.fieldNames.year]}}"></field-actual-value>' +
						'</span>' +
					'</div>',
			link: function (scope, element, attrs) {
				var valueArray = scope.field.value.split('/'), fieldName = scope.field.name;
				scope.user[fieldName].value = {}, scope.formatStr = 'MM-DD-YYYY';
				// If we set fieldNames as a property of the scope object, then it is not accessible inside the ng-repeat directive. So we have set it as a property of the field object. Not sure as to why fieldNames is accessible if we set it as a property of the field object.
				scope.field.fieldNames = {
					date: (scope.field.name + '_DATE'),
					month: (scope.field.name + '_MONTH'),
					year: (scope.field.name + '_YEAR')
				};
				
				// We'll have to keep a single delimiter in the format.
				if(scope.field.format) {
					scope.formatStr = scope.field.format.replace(/\//g, '-')
				}
				scope.formatStr = scope.formatStr.split('-');
				
				for(var i = 0; i < scope.formatStr.length; i++) {
					switch(scope.formatStr[i]) {
						case 'DD':
							scope.user[fieldName].value[scope.field.fieldNames.date] = (valueArray[i] ? valueArray[i] : '');
							break
						case 'MM':
							scope.user[fieldName].value[scope.field.fieldNames.month] = (valueArray[i] ? valueArray[i] : '');
							break
						case 'YYYY':
							scope.user[fieldName].value[scope.field.fieldNames.year] = (valueArray[i] ? valueArray[i] : '');
							break
					}
				}
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
					'<div ng-if="field.is_single_col"><input text-field-blur name="qs-{{::field.name}}" type="tel" maxlength="" placeholder="" ng-model="singlePhoneNumber.value"/><field-actual-value field-name="{{::field.name}}" field-value="{{formattedNo}}"></field-actual-value></div>' +
					'<div ng-if="!field.is_single_col">' +
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
					scope.singlePhoneNumber.value = scope.user[fieldName].value[fieldName + "_AREA"] + 
										scope.user[fieldName].value[fieldName + "_PREFIX"] +
										scope.user[fieldName].value[fieldName + "_NUMBER"],
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
						scope.user[fieldName].value[fieldName + "_AREA"] = scope.formattedNo.substring(0, 3);
						scope.user[fieldName].value[fieldName + "_PREFIX"] = scope.formattedNo.substring(3, 6);
						scope.user[fieldName].value[fieldName + "_NUMBER"] = scope.formattedNo.substring(6);
						
						$rootScope.$emit('singlePhoneFieldUpdated', {newValue: newValue})
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
						
						scope.user[fieldName].value[fieldName + "_AREA"] = newValues[0];
						scope.user[fieldName].value[fieldName + "_PREFIX"] = newValues[1];
						scope.user[fieldName].value[fieldName + "_NUMBER"] = newValues[2];
						
						if (newValues[0] !== oldValues[0] && (newValues[0].length === 3)){ // Check if area is changed & length === maxlength, then move cursor to prefix field
							// Setting the focus without a timeout wasn't firing the blur event for the area element(blur event is needed to track the changed value).
							$timeout(function(){
								prefixElem.focus();
							});
						}else if (newValues[1] !== oldValues[1] && (newValues[1].length === 3)){ // Check if prefix is changed & length === maxlength, then move cursor to number field
							// Setting the focus without a timeout wasn't firing the blur event for the prefix element(blur event is needed to track the changed value).
							$timeout(function(){
								numberElem.focus();
							});
						}
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
		// Set the highest priority so that it's link function is executed before all the other directives' added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		template: '<div ng-if="field.type === \'Text\'">' +
						'<label>' + 
							// don't use ng-model and only use value attribute so LeadId script can read the field
							// ng-model will set value property and not the attribute
							'<input class="ng-hide" id="leadid_tcpa_disclosure" name="HomePhoneConsent" type="text" value="{{user[field.name].value}}">' + 
							'<span ng-bind="field.label"></span>' + 
						'</label>' + 
					'</div>' + 
					'<div ng-if="field.type === \'Checkbox\'">' + 
						'<label ng-repeat="option in ::field.options">' + 
							/* For checkbox case, LeadID will read value only if checkbox is checked.
							   In case checked attribute is set using javascript, Passive consent issue may occur from LeadID
							   so we've used ng-if to show/hide HTML input with checked attribute */ 
							'<input ng-if="isChecked == option.value" name="HomePhoneConsent" type="checkbox" checked value="{{::option.value}}" ng-model="user[field.name].value" ng-change="setValue()" ng-true-value="\'{{::option.value}}\'" ng-false-value="\'\'"/>' + 
							'<input ng-if="isChecked != option.value" name="HomePhoneConsent" type="checkbox" value="{{::option.value}}" ng-model="user[field.name].value" ng-change="setValue()" ng-true-value="\'{{::option.value}}\'" ng-false-value="\'\'"/>' + 
							'<span ng-bind="option.label"></span>' + 
						'</label>' + 
					'</div>',
		link: function(scope, element, attrs, controller){
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

// Phonefield placeholder Directive 
mainApp.directive('placeHolder', ['NotificationService', 'UserDataService', '$rootScope', function(NotificationService, UserDataService, $rootScope) {
		return {
			restrict: 'A',
			// Set a priority higher than phoneField so that it's link function is executed after phoneField's link function.
			priority: 2,
			require: "phoneField", // To access phoneField's controller, we have to pass the 'require' parameter
			link: function (scope, element, attrs, phoneCtrl) {
				// phoneCtrl is phoneField's controller. We use it to access the singlePhoneNumber object.
				if(scope.field.is_single_col) {
					NotificationService.subscribe('repeatComplete', function(event, args){
						// Listen for singlePhoneFieldUpdated event and format the phone number using phonefield's controller so that the original object is updated as well.
						$rootScope.$on('singlePhoneFieldUpdated', function(event, args){
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
		template: '<generate-field ng-if="field.name === \'HomePhoneConsent\'" field-type="HomePhoneConsent" user="user" field="field"></generate-field>' + 
				'<generate-field ng-if="field.name !== \'HomePhoneConsent\'" field-type="Actual{{::field.type}}" user="user" field="field"></generate-field>'
	}
}]);

// Text field directive
mainApp.directive("textField", [function(){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives' added as attributes on this directive.
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
				'<input name="qs-{{::field.name}}" text-field-blur ng-model="user[field.name].value"/>' + 
				'<field-actual-value field-name="{{::field.name}}" field-value="{{user[field.name].value}}"></field-actual-value>' + 
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
		// Set the highest priority so that it's link function is executed before all the other directives' added as attributes on this directive.
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
						'<span ng-bind="option.label"></span>' + 
					'</label>' + 
					'<field-actual-value field-name="{{::field.name}}" field-value="{{user[field.name].value}}"></field-actual-value>' + 
				'</div>',
		link: function(scope, element, attrs, controller){
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
}]);

// Radio button directive
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

// Radio button directive
mainApp.directive("radioInTable", [function(){
	return {
		restrict: 'E',
		// Set the highest priority so that it's link function is executed before all the other directives' added as attributes on this directive.
		priority: 1,
		scope: {
			user: '=',
			field: '='
		},
		template: '<div ng-click="updateModel(field.name, option.value)" ng-class="{myclass: option.value == user[field.name].value}" ng-repeat="option in ' 			+ 'field.options track by option.value" ng-bind="option.label"></div><field-actual-value field-value="{{user[field.name].value}}" field-name="{{::field.name}}"></field-actual-value>',
		// Add the controller so that it can be shared with other directives added as attributes on this directive.
		controller: ['$scope', function($scope){}],
		link: function(scope, element, attrs, controller){
			scope.updateModel = function(fieldName, value) {
				if(scope.user[fieldName].value === value)
					scope.user[fieldName].unchanged = new Date().getTime()  // flag to handle a case in which user clicks on the same option and shownext should be called
                scope.user[fieldName].value = value;
            }
		}
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
					'<span ng-bind="text"></span>' +
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
mainApp.directive('singleQuestionDirective',['$rootScope', 'SingleQuestion', 'SingleQStepVisibilityService', 'NotificationService', 'MyConfig', function($rootScope, SingleQuestion, SingleQStepVisibilityService, NotificationService, MyConfig) {
	return {
        restrict: 'E',
        scope: {
			user: '=',
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
			var typesToIgnore = 'text|checkbox|date', 
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
				SingleQuestion.init(scope.singleQuestionOptions).then(function(){
					// Bind watchers only after SingleQuestion init method is resolved.
					$rootScope.$on('fieldValueChanged', function(event, args){
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
        }
    }      
}]);