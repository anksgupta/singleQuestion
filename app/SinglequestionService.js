mainApp.factory("SingleQuestion", ['$rootScope', 'CBQService', '$q', '$timeout', function($rootScope, CBQService, $q, $timeout){
	var defaults = {
        callback: {},
        current: -1,
        steps: 0,
		cbq: {},
		CBQObj: {},
        history_back: false
	};
	return {
		init: function(options){
			angular.extend(this, options);
			this.steps = this.order.length;
			
			if(typeof this.callback['before_load'] === 'function')
				this.callback['before_load'].call(this)
				
			for(var index = 0; index <= this.order.length - 1; index++) {
				this.current = index;
				if (!this.isValidElem(this.order[index]))
					break;
			}
			
			//$timeout(function(){
			$rootScope.$broadcast('currentUpdated');
			//})
			
			this.setProgressBarWidth();
			
			if(typeof this.callback['after_load'] === 'function')
				this.callback['after_load'].call(this)
			
			return this
		},
		isValidElem: function(field){
			if(!field)
				field = this.order[this.current]
			var result = true;
			if(angular.isArray(field)){
				for(var i = 0;i < field.length; i++){
					if(!this.getUserData(field[i])){
						result = false;
						break
					}
				}
			}else{
				if(!this.getUserData(field))
					result = false
			}
			return result
		},
		showNext: function(){
			var nextElem, postDataObj = {}, promises = [], fieldCount = 0, cbqCount = 0, self = this;
			if(typeof this.callback['before_next'] === 'function')
				this.callback['before_next'].call(this)
				
			if(this.isValidElem()){
				nextElem = this.order[this.current + 1];
				this.CBQObj = this.isCBQ(nextElem);
				angular.forEach(this.CBQObj, function(obj, elem){
					var deferredItemList = $q.defer();
					
					if(obj['is_cbq']){
						postDataObj['key'] = self.cbq[elem].k;
						postDataObj[self.cbq[elem].p[0]] = self.getUserData(elem);
						CBQService.handleCBQ(postDataObj)
							.then(function(data){
								if(data){
									cbqCount++;
									obj['visible'] = true;
								}else {
									obj['visible'] = false
								}
								deferredItemList.resolve("is-cbq");
							}, function(data){
								if(data){
									cbqCount++;
									obj['visible'] = true;
								}else {
									obj['visible'] = false
								}
								deferredItemList.resolve("is-cbq");
							});	
					} else {
						fieldCount++;
						deferredItemList.resolve(fieldCount);
					}
					promises.push(deferredItemList.promise);
				})
				
				$q.all(promises).then(function(cbqCount) {
					console.log(cbqCount.indexOf('is-cbq') > -1)
					self.current++;
					if(cbqCount.indexOf('is-cbq') > -1){
						$rootScope.$broadcast('currentUpdated')
					}else{
						self.showNext()
					}
					self.setProgressBarWidth();
			
					if(typeof self.callback['after_next'] === 'function')
						self.callback['after_next'].call(self)
				});
			}
		},
		showPrevious: function(){
			if(typeof this.callback['before_prev'] === 'function')
				this.callback['before_prev'].call(this)
		
			this.current--;
			$rootScope.$broadcast('currentUpdated');
			this.setProgressBarWidth();
			
			if(typeof this.callback['after_prev'] === 'function')
				this.callback['after_prev'].call(this)
		},
		getElement: function(index){
			if(!index)
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
				if(this.CBQObj[name] && this.CBQObj[name]['visible']){
					return (this.order[this.current].indexOf(name) > -1 && this.CBQObj[name]['visible'])
				}
				return (this.order[this.current].indexOf(name) > -1)
			}else{
				return name === this.order[this.current]
			}
		},
		hasError: function(){
			return true
		},
		getUserData: function(field){
			if(typeof this.callback['getUserData'] === 'function')
				return this.callback['getUserData'].call(this, field)
			return false
		},
		isCBQ: function(field){
			if(typeof this.callback['isCBQ'] === 'function')
				return this.callback['isCBQ'].call(this, field)
			return false
		}
	}
}]);