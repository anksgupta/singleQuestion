mainApp.factory("AnimationService", ['$q', function($q){
	/**
	*	This service contains APIs to animate a particular element or a set of elements using Velocity.js.
	*	Velocity.js URL: http://julian.com/research/velocity/
	*	Feel free to add any custom animation with appropriate documentation.
	*	Don't use jQuery to handle animations
	*/
	var slideMap = ['Up', 'Down', 'Left', 'Right'], fadeMap = ['In', 'Out'];
	return {
		/**
		*	Slide up/down functionality
		*	NOTE: If callback function is passed as the third parameter in place of options, velocity internally checks for the parameter type & considers it as the callback
		*	Velocity iterates through all options arguments and treats:
		*	- number as a duration
		*	- strings and arrays as easings
		*	- function as a complete callback
		*/
		slideUpDown: function(element, direction, options, callback) {
			if(slideMap.indexOf(direction) > -1){
				Velocity(element, 'slide' + direction, options, (typeof callback === 'function') ? callback(element) : undefined)
			}
        },
		/**
		*	Fade in/out functionality
		*	Callback functionality is the same as slide up/down
		*/
		fadeInOut: function(element, effect, options, callback) {
			if(fadeMap.indexOf(effect) > -1){
				Velocity(element, 'fade' + effect, options, (typeof callback === 'function') ? callback(element) : undefined)
			}
        },
		// Need to update jQuery show/hide in the future with animation
		/*show: function(element, options, callback) {},
		hide: function(element, options, callback) {},*/
		/**
		*	@params
		*	element: angular or javascript element reference
		*	properties: css properties to be animated
		*	options: object which contains options like duration, easing, etc. begin, progress & complete are the 3 callbacks which are a part of options object
		*/
		animate: function(element, properties, options){
			return Velocity(element, properties, options)
		},
		reverse: function(element) {
			Velocity(element, 'reverse')
        },
		slideLeftRight: function(element, direction, options, callback) {
			if(slideMap.indexOf(direction) > -1){
					for(var index = 0; index < element.length; index++) {
						element[index].style.position = 'relative';
						element[index].style.display = 'block';
						element[index].style.opacity = '';
						if(direction === 'Left'){
							element[index].style.left = '100%';
						} else if(direction === 'Right'){
							element[index].style.left = '-100%';
						}
					}
				this.animate(element, {left:'0%'}, options, function(){
						for(var index = 0; index < element.length; index++) {
							element[index].style.position = 'static';
						}
						if(typeof callback === 'function')
							callback(element);
					})
			}
        },
	}
}]);