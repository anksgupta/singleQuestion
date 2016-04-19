mainApp.factory("AnimationService", ['$q', function($q){
	return {
		animate: function(element, options) {
            var start = new Date;
			if(element.length > 0){
				element.addClass('animating')
				var id = setInterval(function() {
					var timePassed = new Date - start;
					var progress = timePassed / options.duration;
					if (progress > 1) {
						progress = 1;
					}
					options.progress = progress;
					var delta = options.delta(progress);
					options.step(delta);
					if (progress == 1) {
						clearInterval(id);
						options.complete();
						element.removeClass('animating')
					}
				}, options.delay || 10);
				}
        },
        fadeOut: function(element, options) {
            var to = 1, ngElement = angular.element(element);
			this.animate(ngElement, {
                duration: options.duration,
                delta: function(progress) {
                    progress = this.progress;
                    //return FX.easing.swing(progress);
                    return progress;
                },
                complete: options.complete,
                step: function(delta) {
                    element.style.opacity = to - delta;
                }
            });
        },
        fadeIn: function(element, options) {
            var to = 0, ngElement = angular.element(element);
			this.animate(ngElement, {
                duration: options.duration,
                delta: function(progress) {
                    progress = this.progress;
                    //return FX.easing.swing(progress);
                    return progress;
                },
                complete: options.complete,
                step: function(delta) {
                    element.style.opacity = to + delta;
                }
            });
        },
		slideUp: function(element, options) {
            var to = 0, ngElement = angular.element(element);
			this.animate(ngElement, {
                duration: options.duration,
                delta: function(progress) {
                    progress = this.progress;
					return progress;
                },
                complete: options.complete,
                step: function(delta) {
                    element.style.top = to + delta;
                }
            });
        },
	}
}]);