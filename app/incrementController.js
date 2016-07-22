mainApp.controller('incrementController', ['$scope', '$q', 'HttpService', 'InitializationService', 'RouterService', function($scope, $q, HttpService, InitializationService, RouterService){
	
	var data = RouterService.getRouteData();
	angular.extend($scope, InitializationService.initialize(data));
	
	$scope.criteria = InitializationService.getCriteria();
	// For rendering the fields based on order, we have to remove the nested arrays
	$scope.order = [].concat.apply([], data.form.order)
}])