mainApp.factory("CBQService", ['HttpService', '$q', function(HttpService, $q){
	// We haven't injected InitializationService & used getUserData(instead we are passing it as a parameter) because then there will be a cyclic dependency as we inject CBQService in InitializationService.
	var CBQServiceData = {}, fieldsObjCopy;
	return {
		setCBQServiceData: function(scopeFieldObj){
			CBQServiceData = scopeFieldObj;
			fieldsObjCopy = angular.copy(CBQServiceData.fields);
		},
		isCBA: function(criteriaObj){
			return (typeof criteriaObj.a !== "undefined");
		},
		getCBQData: function(fieldName){
			var deferred = $q.defer(), postDataObj = {}, keys = [], parentArr = [], criteriaObj = CBQServiceData.cbq[fieldName],
				isCBA = this.isCBA(criteriaObj), fieldsCount = CBQServiceData.fields[fieldName].options.length, hiddenOptionsCount = 0, fieldVal;
			if(isCBA) {
				for(var i = 0; i < criteriaObj.a.length; i++){
					keys.push(criteriaObj.a[i].k);
					for(var j = 0; j < criteriaObj.a[i].p.length; j++){
						fieldVal = CBQServiceData.getUserData(criteriaObj.a[i].p[j]);
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
					fieldVal = CBQServiceData.getUserData(fieldName);
					postDataObj[fieldName] = (fieldVal.indexOf(null) > -1) ? '' : fieldVal.join('')
				});
			}
			HttpService.getData('/CBQValidator.jsp', postDataObj).then(function(data){
				deferred.resolve(true);
			},function(data){
				if(isCBA){
					// The data for CBA will be a JSON object, e.g : {101312 : true, 101314 : false}
					angular.extend(CBQServiceData.fields[fieldName].options, fieldsObjCopy[fieldName].options)
					for(var index=(criteriaObj.a.length -1); index >= 0; index--){
						if(!data[criteriaObj.a[index].k]){
							// var defaultOptionCount = /select/i.test($elem.find('option:eq(0)').val()) ? 1 : 0;
							var optionIndex = parseInt(Math.log(criteriaObj.a[index].i) / Math.log(2));// + defaultOptionCount
							// this.i is always a multiple of 2, so to derive x we can do e.g 2^x = 4. Hence using logarithms
							CBQServiceData.fields[fieldName].options.splice(optionIndex, 1);
							hiddenOptionsCount++;
						}
					}
					// Below case ensures that if all the options are hidden for a CBA question, then hide that question
					(fieldsCount > hiddenOptionsCount) ? deferred.resolve(true) : deferred.resolve(false);
				}else{
					deferred.resolve(true);
				}
			});
			return deferred.promise;
		}
	}
}]);