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
    .controller('MainCtrl', ['$scope', 'appConfig', '$fetchData', 'appData', function ($scope, appConfig, $fetchData, appData) {
        var _id = '5397ca5dc0c8174642000001';
        $scope.dataUsers = appData.Users;
        $scope.dataPosts = appData.Posts;
        console.log('Users loaded : ',appData.Users);
        console.log('Posts loaded : ',appData.Posts);
        $fetchData.getDataId('UserAuths', _id, 'Users').then(function (resp) {
            console.log('data : ', resp.email);
        }, function (err) {
            console.log('err :', err);
        });
    }]);