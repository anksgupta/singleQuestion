mainApp.factory("CBQService", ['HttpService', '$q', 'UserDataService', function(HttpService, $q, UserDataService){
	// Make sure always an object containing {criteria_key:value} pairs is returned as the CBQ response from the back end.
	var CBQServiceData = {}, fieldsObjCopy;
	return {
		init: function(){
			fieldsObjCopy = angular.copy(UserDataService.getFields());
		},
		isCBA: function(criteriaObj){
			return (typeof criteriaObj.a !== "undefined")
		},
		getCBQData: function(fieldName){
			var deferred = $q.defer(), postDataObj = {}, keys = [], parentArr = [], criteriaObj = UserDataService.getFieldCriteria(fieldName),
				isCBA = this.isCBA(criteriaObj), fieldsCount = hiddenOptionsCount = 0, fieldVal, element = UserDataService.getField(fieldName);
			// Execute the CBQ/CBA logic iff the field is available.
			if(element) {
				if(isCBA) {
					fieldsCount = element.options.length;
					for(var i = 0; i < criteriaObj.a.length; i++){
						keys.push(criteriaObj.a[i].k);
						for(var j = 0; j < criteriaObj.a[i].p.length; j++){
							fieldVal = UserDataService.getUserData(criteriaObj.a[i].p[j]);
							if(parentArr.indexOf(criteriaObj.a[i].p[j]) === -1){
								parentArr.push(criteriaObj.a[i].p[j]);
								postDataObj[criteriaObj.a[i].p[j]] = (fieldVal.indexOf(null) > -1) ? '' : fieldVal.join('')
							}
						}
					}
					postDataObj['key'] = keys.join(',');
				}else {
					postDataObj['key'] = criteriaObj.k;
					angular.forEach(criteriaObj.p, function(fieldName, index){
						fieldVal = UserDataService.getUserData(fieldName);
						postDataObj[fieldName] = (fieldVal.indexOf(null) > -1) ? '' : fieldVal.join('')
					});
				}
				HttpService.getData('/CBQValidator.jsp', postDataObj).then(function(data){
					if(isCBA){
						// The data for CBA will be a JSON object, e.g : {101312 : true, 101314 : false}
						angular.extend(element.options, fieldsObjCopy[fieldName].options);
						for(var index=(criteriaObj.a.length -1); index >= 0; index--){
							if(!data[criteriaObj.a[index].k]){
								// var defaultOptionCount = /select/i.test($elem.find('option:eq(0)').val()) ? 1 : 0;
								var optionIndex = parseInt(Math.log(criteriaObj.a[index].i) / Math.log(2));// + defaultOptionCount
								// this.i is always a multiple of 2, so to derive x we can do e.g 2^x = 4. Hence using logarithms
								element.options.splice(optionIndex, 1);
								hiddenOptionsCount++;
							}
						}
						// Below case ensures that if all the options are hidden for a CBA question, then hide that question
						(fieldsCount > hiddenOptionsCount) ? deferred.resolve(true) : deferred.resolve(false);
					}else{
						deferred.resolve((typeof data[criteriaObj.k] !== 'undefined') ? data[criteriaObj.k] : false);
					}
				},function(data){
					if(isCBA){
						// The data for CBA will be a JSON object, e.g : {101312 : true, 101314 : false}
						angular.extend(element.options, fieldsObjCopy[fieldName].options);
						for(var index=(criteriaObj.a.length -1); index >= 0; index--){
							if(!data[criteriaObj.a[index].k]){
								var optionIndex = parseInt(Math.log(criteriaObj.a[index].i) / Math.log(2));// + defaultOptionCount
								// this.i is always a multiple of 2, so to derive x we can do e.g 2^x = 4. Hence using logarithms
								UserDataService.getField(fieldName).options.splice(optionIndex, 1);
								hiddenOptionsCount++;
							}
						}
						// Below case ensures that if all the options are hidden for a CBA question, then hide that question
						(fieldsCount > hiddenOptionsCount) ? deferred.resolve(true) : deferred.resolve(false);
					}else{
						deferred.resolve((typeof data[criteriaObj.k] !== 'undefined') ? data[criteriaObj.k] : false);
					}
				});
			} else {
				// Reject the promise if field object is not available.
				deferred.reject('CBQService:: Field object not available');
			}
			return deferred.promise;
		}
	}
}]);