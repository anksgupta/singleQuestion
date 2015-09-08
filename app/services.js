mainApp.factory("SingleQuestion", ['$rootScope', function($rootScope){
	var defaults = {
        callback: {},
        current: -1,
        steps: 0,
        history_back: false,
        auto_submit: true,
	};
	return {
		init: function(options){
			angular.extend(this, options);
			this.steps = this.order.length;
			
			for(var index = 0; index <= this.order.length - 1; index++) {
				this.current = index;
				if (!this.isValidElem(this.order[index]))
					break;
			}
			
			$rootScope.$broadcast('currentUpdated');
			this.setProgressBarWidth();
			return this
		},
		isValidElem: function(field){
			if(!field)
				field = this.order[this.current]
			var result = true;
			if(angular.isArray(field)){
				for(var i = 0;i < field.length; i++){
					if(!this.user[field[i]].value){
						result = false;
						break
					}
				}
			}else{
				if(!this.user[field].value)
					result = false
			}
			return result
		},
		showNext: function(){
			if(this.isValidElem())
				this.current++;
				
			$rootScope.$broadcast('currentUpdated');
			this.setProgressBarWidth()
		},
		showPrevious: function(){
			this.current--;
			$rootScope.$broadcast('currentUpdated');
			this.setProgressBarWidth()
		},
		getElement: function(index){
			if(index === undefined)
				index = this.current;
			return this.order[index]
		},
		setProgressBarWidth: function(){
			var width = Math.floor((this.current * 100) / this.steps);
			this.progressBarWidth = width;
			
			$rootScope.$broadcast('progressBarWidthUpdated');
		},
		checkVisibility: function(name){
			if(angular.isArray(this.order[this.current])){
				return this.order[this.current].indexOf(name) > -1
			}else{
				return name === this.order[this.current]
			}
		},
		hasError: function() {
			return true
		}
	}
}]);