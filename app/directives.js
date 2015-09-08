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

mainApp.directive('checkForCbq', ['$timeout', function($timeout){
	return {
		restrict: 'A',
		scope:true,
		controller: ['$scope', function($scope) {
			$scope.visible = true
	    }],
		link: function link(scope, element, attrs) {
			var field = scope.fields[scope.elem];
			if(field['is_cbq']){
				$timeout(function(){
					var parents = scope.cbq[scope.fields[scope.elem].name].p;
					angular.forEach(parents, function(parent){
						scope.$watch(function(){return scope.user[parent]}, function(value) {
							console.log('value changed, new value is: ' + value);
					    });
					});
				});
			}
	    }
	}
}]);