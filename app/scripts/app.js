'use strict';

angular.module('vClientApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'vClientApp.restful',
    'vClientApp.logger',
    'vClientApp.baseModel',
    'vClientApp.fetchData',
    'vClientApp.socket',
    'vClientApp.auth'
])
    .constant('appConfig', {
        deviceId: (window.device) ? device.uuid.toLowerCase() : 'what.do.namehihi????',
        defaultPass: 'defaultPassword',
        name: 'iTaxi',
        apiHost: 'http://nodejs.vn:1212', // taxigo.vn:9697
        mediaHost: 'http://vsoft.vn:1235'
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    });
