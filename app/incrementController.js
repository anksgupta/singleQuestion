// Always get the module reference rather than using the existing app reference. If you use the existing app reference, then it gives an error if you try and load the controller using ocLazyLoad.
angular.module('mainApp').controller('incrementController', ['$scope', '$q', 'HttpService', 'InitializationService', 'RouterService', function($scope, $q, HttpService, InitializationService, RouterService){
	
	var data = RouterService.getRouteData();
	angular.extend($scope, InitializationService.initialize(data));
	
	$scope.criteria = InitializationService.getCriteria();
	// For rendering the fields based on order, we have to remove the nested arrays
	$scope.order = [].concat.apply([], data.form.order)
}])