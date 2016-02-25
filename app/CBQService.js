mainApp.factory("CBQService", ['HttpService', '$q', function(HttpService, $q){
	var CBQServiceData = {}, fieldsObjCopy;
	return {
		setCBQServiceData: function(scopeFieldObj){
			CBQServiceData = scopeFieldObj;
			fieldsObjCopy = angular.copy(CBQServiceData.fields);
		},
		isCBA: function(criteriaObj){
			return (typeof criteriaObj.a !== "undefined");
		},
		getFields: function(){
			return CBQServiceData.fields;
		},
		getCBQData: function(fieldName, criteriaObj){
			var deferred = $q.defer(), postDataObj = {}, keys = [], parentArr = [], isCBA = this.isCBA(criteriaObj), 
				fieldsCount = CBQServiceData.fields[fieldName].options.length, hiddenOptionsCount = 0;
			if(isCBA) {
				for(var i=0; i < criteriaObj.a.length; i++){
					keys.push(criteriaObj.a[i].k);
					for(var j=0; j < criteriaObj.a[i].p.length; j++){
						if(parentArr.indexOf(criteriaObj.a[i].p[j]) === -1){
							parentArr.push(criteriaObj.a[i].p[j]);
							postDataObj[criteriaObj.a[i].p[j]] = CBQServiceData.getUserData(criteriaObj.a[i].p[j])
						}
					}
				}
				postDataObj['key'] = keys.join(',');
			}else {
				postDataObj['key'] = criteriaObj.k;
				postDataObj[criteriaObj.p[0]] = CBQServiceData.getUserData(criteriaObj.p[0]);
			}
			HttpService.getData('/CBQValidator.jsp',postDataObj).then(function(data){
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
					(fieldsCount > hiddenOptionsCount) ? deferred.resolve(true) : deferred.resolve(false);
				}else{
					deferred.resolve(true);
				}
			});
			return deferred.promise;
		}
	}
}]);