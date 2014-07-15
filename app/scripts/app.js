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
    'vClientApp.auth'
])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
