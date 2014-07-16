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
    .controller('MainCtrl', ['$scope', 'appConfig', '$fetchData', function ($scope, appConfig, $fetchData) {

        console.log('appConfig : ', appConfig.apiHost);
        $fetchData.getData('users', null, null, null, null).then(function (resp) {

            console.log('data Users : '), resp.all();

        }, function (err) {
            console.log('err : ', err);
        })
    }]);