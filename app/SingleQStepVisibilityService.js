mainApp.factory("SingleQStepVisibilityService", ['AnimationService', function(AnimationService){
	return {
		/**
		*	This HAS to be a site specifc service which SHOULD implement the method showHideStep inside which the user has the option of using multiple custom 
		*	animations defined in AnimationService for showNext(hide & show) and showPrevious(hide & show)
		*	@params
		*	stepObj: Object which contains the below map
		*	- elementsToHide : array containing element names which this service should hide
		*	- elementsToShow : array containing element names which this service should show
		*	- stepDirection : contains the values next(sent in case of showNext), previous(sent in case of showPrevious)
		*/
		showHideStep: function(stepObj) {
			// first hide previously active step 
			AnimationService.fadeInOut(document.querySelectorAll('#input-' + stepObj.elementsToHide.join(',#input-')), 'Out', {duration: 0});
			
			AnimationService.fadeInOut(document.querySelectorAll('#input-' + stepObj.elementsToShow.join(',#input-')), 'In');
		}
	}
}]);