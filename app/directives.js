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
		scope: true,
		template: '<div ng-click="" ng-class="{myclass: option.value == user[fields[elem].name]}" class="select-container">' + 
					'<span class="selected-text">{{selectedText}}</span>' + 
					'<select ng-change="next()" name="{{fields[elem].name}}" ng-model="user[fields[elem].name]" ng-options="option.value as option.label for option in fields[elem].options"></select>' + 
				'</div>',
		controller: ['$scope', function($scope) {
			
	    }],
	    link: function(scope, element, attrs) {
			
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
        scope: true,
        link: function(scope, element, attrs){
			scope.name = attrs["toggleField"];
			scope.$on('currentUpdated', function(){
				SingleQuestion.checkVisibility(scope.name) ? element.removeClass('ng-hide') : element.addClass('ng-hide');
			});
        }
    }      
}]);