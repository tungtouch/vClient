/**
 * Created by taipham.it on 7/20/2014.
 */
'use strict';

angular.module('vClientApp').
    factory('appData', ['$fetchData', '$q', '$collection','dataStorage', function ($fetchData, $q, $collection,dataStorage) {
        var defer = $q.defer();
        var data = {};

        data.Users = null;
        data.Posts = null;
        data.load = function () {
            $q.all([

                $fetchData.getData('UserAuths', null, null, null, null).then(function (resp) {
                    data.Users = resp.all();
                    dataStorage.Users.addAll(data.Users);
                }, function (err) {
                }),

                $fetchData.getData('Posts', null, null, null, null).then(function (resp) {
                    data.Posts = resp.all();
                }, function (err) {
                })
            ]).then(function (resp) {
                defer.resolve(data);
            }, function (err) {
                defer.reject(err);
            })
            return defer.promise;
        }
        return data;
    }]);
