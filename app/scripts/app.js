'use strict';

angular.module('vClientApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'vClientApp.config',
    'vClientApp.restful',
    'vClientApp.logger',
    'vClientApp.baseModel',
    'vClientApp.fetchData',
    'vClientApp.socket',
    'vClientApp.auth',
    'ngCollection'
])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    }).run(['$rootScope', '$fetchData', 'dataStorage', function ($rootScope, $fetchData, dataStorage) {

        $fetchData.getData('UserAuths', null, null, null, null).then(function (resp) {
            dataStorage.Users.addAll(resp.all());
            console.log('dataStorage.Users :',dataStorage.Users.all());
        }, function (err) {
            console.log('err : ', err);
        });



    }])
