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
			var elementsToShow = document.querySelectorAll('#input-' + stepObj.elementsToShow.join(',#input-')),
				elementsToHide = document.querySelectorAll('#input-' + stepObj.elementsToHide.join(',#input-'));
			switch(stepObj.stepDirection){
				case 'next':
					AnimationService.slideLeftRight(elementsToShow, 'Left', {duration: 400});
					AnimationService.fadeInOut(elementsToHide, 'Out', {duration: 0});
					break;
				case 'previous':
					AnimationService.slideLeftRight(elementsToShow, 'Right', {duration: 400});
					AnimationService.fadeInOut(elementsToHide, 'Out', {duration: 0});
					break;
				case 'load':
					AnimationService.fadeInOut(elementsToShow, 'In');
					AnimationService.fadeInOut(elementsToHide, 'Out');
					break;
			}
		}
	}
}]);