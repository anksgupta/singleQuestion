// Always get the module reference rather than using the existing app reference. If you use the existing app reference, then it gives an error if you try and load the controller using ocLazyLoad.
angular.module('mainApp').controller('tyController', ['$scope', 'RouterService', function($scope, RouterService){
	var data = {sl: {domain: '\\test.com', params: {country: 'US'}}}//RouterService.getRouteData();
	//angular.extend($scope, InitializationService.initialize(data));
	
	$scope.domain = data.sl.domain;
	$scope.params = data.sl.params;
	$scope.errorCallback = function(obj){
		
	}
}])