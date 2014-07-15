'use strict';

angular.module('vClientApp.restful', ['vClientApp.logger','vClientApp.config'])
    .service('$restful', ['$resource', 'appConfig', function $restful($resource, appConfig) {


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