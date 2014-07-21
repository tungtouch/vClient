'use strict';

angular.module('vClientApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'vFramework',
    'ngCollection',
    'ui.router',
    'angularFileUpload'
])
    .config(function ($stateProvider,$urlRouterProvider) {
        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('main', {
                url : '/main',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                resolve: {
                    'AppLoad': ['appData', '$q', '$logger', '$rootScope', function (appData, $q, $logger, $rootScope) {
                        var AppLoad = $q.defer();
                        if (!$rootScope.statusLoaded) {
                            appData.load().then(function (resp) {
                                AppLoad.resolve(true);
                            }, function () {
                                AppLoad.reject(false);
                            })
                        } else {
                            AppLoad.resolve(true);
                        }
                        return AppLoad.promise;
                    }]
                }
            })
            .state('loading', {
                url : '/',
                templateUrl: 'views/loading.html',
                controller: 'loading'
            });

    }).run(['$rootScope', '$fetchData', 'dataStorage', function ($rootScope, $fetchData, dataStorage) {
        $rootScope.statusLoaded = false;
    }])