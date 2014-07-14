'use strict';

angular.module('vClientApp.restful', ['vsoftApp.logger'])
    .service('$restful', ['$resource', 'appConfig', '$logger', function $restful($resource, appConfig, $logger) {

        $logger.moduleName = 'core.vsoft.restful - Restful Service';

        return $resource(appConfig.apiHost + '/:api/:table/:id', {
            api: 'api',
            id: '@id',
            table: '@table'
        }, {
            'get': {method: 'GET'},
            'save': {method: 'POST', params: {}},
            'put': {method: 'PUT', params: {}},
            'query': {method: 'GET', isArray: true},
            'delete': {method: 'DELETE', params: {}}
        });

    }]);