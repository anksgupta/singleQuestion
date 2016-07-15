mainApp.factory("AnimationService", ['$q', function($q){
	/**
	*	This service contains APIs to animate a particular element or a set of elements using Velocity.js.
	*	Velocity.js URL: http://julian.com/research/velocity/
	*	Feel free to add any custom animation with appropriate documentation.
	*	Don't use jQuery to handle animations
	*/
	var fadeMap = ['In', 'Out'];
	return {
		/**
		*	Slide up/down/left/right functionality
		*	NOTE: If callback function is passed as the third parameter in place of options, velocity internally checks for the parameter type & considers it as the callback
		*	Velocity iterates through all options arguments and treats:
		*	- number as a duration
		*	- strings and arrays as easings
		*	- function as a complete callback
		*/
		slide: function(element, direction, options, callback) {
			switch(direction){
				case 'Up': case 'Down':
					Velocity(element, 'slide' + direction, options, function(){
						if(typeof callback === 'function')
							callback(element);
					});
					break;
				case 'Left': case 'Right':
					for(var index = 0; index < element.length; index++) {
						element[index].style.position = 'relative';
						element[index].style.display = 'block';
						element[index].style.opacity = '';
						element[index].style.left = (((direction === 'Left') ? '+' : '-') + '100%')
					}
					options.complete = function(){
						for(var index = 0; index < element.length; index++) {
							element[index].style.position = 'static';
						}
						if(typeof callback === 'function')
							callback(element);
					};
					this.animate(element, {left:'0%'}, options);
					break;
			}
        },
		/**
		*	Fade in/out functionality
		*	Callback functionality is the same as slide up/down
		*/
		fadeInOut: function(element, effect, options, callback) {
			switch(effect){
				case 'In': case 'Out':
					Velocity(element, 'fade' + effect, options, (typeof callback === 'function') ? callback(element) : undefined);
					break
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
		stop: function(element) {
			Velocity(element, 'stop', true)
        }
	}
}]);