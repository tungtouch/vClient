/**
 * Created by taipham.it on 7/15/2014.
 */
'use strict';


angular.module('vClientApp')
    .controller('MainCtrl', ['$scope', 'appConfig', '$fetchData', function ($scope, appConfig, $fetchData) {
        console.log('appConfig : ', appConfig.apiHost);
        $fetchData.getData('users', null, null, null, null).then(function (resp) {
            if (resp.success) {
                console.log('data Users : '), resp.all();
            } else {
                console.log('err : ', resp);
            }
        })
    }]);