// Radio button directive
mainApp.directive("radioInTable", function(){
	return {
		restrict: 'E',
		scope: {
			fieldname: '=',
			options: '=',
			user: '='
		},
		template: '<div ng-click="updateModel(fieldname, option.value)" ng-class="{myclass: option.value == user[fieldname].value}" ng-repeat="option in options" ng-bind-html="option.label | preseveHtml"></div>',
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
			fieldname: '=',
			options: '=',
			user: '='
		},
		template: '<div class="select-container">' + 
					'<span class="selected-text">{{user[fieldname].value}}</span>' + 
					'<ul name="{{fieldname}}" ng-model="user[fieldname]">'+
						'<li ng-repeat="option in options" value="{{option.value}}" ng-click="updateModel(option.value)" ng-class="{myclass: option.value == user[fieldname]}">{{option.label}}</li>'+
					'</ul>'+
					'<select name="{{fieldname}}" ng-model="user[fieldname]" ng-options="option.value as option.label for option in options"></select>' + 
				'</div>',
		controller: ['$scope', function($scope) {
			
	    }],
	    link: function(scope, element, attrs) {
			var fieldName = scope.fieldname;
			scope.updateModel = function(value) {
				if(scope.user[fieldName].value == value)
					scope.user[fieldName].unchanged = new Date().getTime()  // flag to handle a case in which user clicks on the same option and shownext should be called
                scope.user[fieldName].value = value;
            }
	    }
	}
});

// Handle Textbox change event on blur
mainApp.directive('onChange', function() {
    return {
        restrict: 'A',
        scope:true,
        link: function(scope, element, attrs){
            element.bind('blur', function() {
                var currentValue = element.val();                
                if(scope.onChange !== currentValue){
                    scope.$apply(function(){
                        scope.onChange = currentValue;
                    });
                }
            });
        }
    }      
});

mainApp.directive('checkForCbq', ['CBQService', function(CBQService){
	return {
		restrict: 'E',
		scope: {
			fieldname: '=',
			field: '=',
			user: '=',
			cbq: '='
		},
		controller: ['$scope', function($scope) {
			//$scope.visible = true
	    }],
		link: function link(scope, element, attrs) {
			if(scope.field['is_cbq']){
				scope.postDataObj = {};
				angular.forEach(scope.cbq[scope.fieldname].p, function(parent){
					scope.$watchCollection(function(){return scope.user[parent]}, function(newValue) {
						console.log('value changed, new value is: ' + newValue.value);
						scope.postDataObj['key'] = scope.cbq[scope.fieldname].k;
						scope.postDataObj[scope.cbq[scope.fieldname].p] = newValue.value;
						CBQService.handleCBQ(scope.postDataObj)
							.then(function(data){
								console.log(data)
							}, function(data){
								
							})
					});
				});
			}
	    }
	}
}]);

// Handle field visibilty on current change
mainApp.directive('toggleField',['SingleQuestion', function(SingleQuestion) {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, element, attrs){
			scope.name = attrs["toggleField"];
			scope.$on('currentUpdated', function(){
				SingleQuestion.checkVisibility(scope.name) ? element.removeClass('ng-hide') : element.addClass('ng-hide');
			});
        }
    }      
}]);

// SingleQuestion directive
mainApp.directive('singleQuestionDirective',['SingleQuestion', '$timeout', function(SingleQuestion, $timeout) {
	return {
        restrict: 'E',
        scope: {
			order: '=',
			cbq: '=',
			user: '=',
			fields: '=',
			validations: '='
		},
		template: '<a href="javascript:;" id="backBtn" ng-click="SingleQuestion.showPrevious();">Back</a>' +
				'<button id="nextBtn" ng-click="SingleQuestion.showNext();">Next</button>' +
				'<button id="submitBtn" ng-click="click()">Submit</button>' +
				'<div class="rail"><div class="inner_rail"><div class="bar" ng-style="{\'width\': progressBarWidth + \'%\'}"></div></div></div>',
        link: function(scope, element, attrs){
			scope.$on('progressBarWidthUpdated', function(){
				scope.progressBarWidth = SingleQuestion.progressBarWidth
			});
			var nextBtnElem = angular.element(document.getElementById('nextBtn')), 
				backBtnElem = angular.element(document.getElementById('backBtn')), 
				submitBtn= angular.element(document.getElementById('submitBtn'));
			
			scope.$on('currentUpdated', function(){
				scope.current = SingleQuestion.current;
				
				SingleQuestion.isValidStep() ? nextBtnElem.removeClass('ng-hide') : nextBtnElem.addClass('ng-hide');
				(scope.current === scope.order.length - 1) ? submitBtn.removeClass('ng-hide') : submitBtn.addClass('ng-hide');
				(scope.current !== 0) ? backBtnElem.removeClass('ng-hide') : backBtnElem.addClass('ng-hide');
			});
			
			scope.SingleQuestion = SingleQuestion.init({
				order: scope.order,
				cbq: eval(scope.cbq),
				fieldValidations : scope.validations,
				callback: {
					'before_next': function(){
						
					},
					'getUserData': function(field){
						return scope.user[field].value
					},
					'isCBQ': function(field){
						var obj = {};
						if(angular.isArray(field)){
							angular.forEach(field, function(elem){
								obj[elem] = {'is_cbq': scope.fields[elem]['is_cbq']}
							});
						}else{
							obj[field] = {'is_cbq': scope.fields[field]['is_cbq']}
						}
						return obj // return value will be something like {'Age': {'is_cbq': true}}
					}
				}
			});
			
			angular.forEach(scope.SingleQuestion.order, function(field){
				if(angular.isArray(field)){
					angular.forEach(field, function(elem){
						addWatch(elem)
					});
				} else {									 
					addWatch(field)
				}
			})
			
			function addWatch(fieldName){
				scope.$watchCollection(function(){return scope.user[fieldName]}, function(newValue, oldValue) {
					if(newValue !== oldValue){
						scope.SingleQuestion.showNext()
					}
				});
			}
        }
    }      
}]);