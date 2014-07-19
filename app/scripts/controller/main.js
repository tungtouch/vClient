/**
 * Created by taipham.it on 7/15/2014.
 */
'use strict';

/**
 * @ngdoc controller
 * @name vClientApp.controllers:MainCtrl
 * @module myapp
 *
 * @description
 * Lorem ipsum dolor sit amet here is my controller's description.
 */

angular.module('vClientApp')
    .controller('MainCtrl', ['$scope', 'appConfig', '$fetchData', 'dataStorage', function ($scope, appConfig, $fetchData, dataStorage) {

        console.log('appConfig : ', appConfig.apiHost);

        $scope.click = function () {
            var _id = '5397ca5dc0c8174642000001';
            $fetchData.getDataId('UserAuths', _id).then(function(resp){
                console.log('data : ',resp.email);
            },function(err){
                console.log('err :',err);
            });
        };
    }]);