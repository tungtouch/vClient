'use strict';

angular.module('vClientApp.fetchData',['core.vsoft.logger', 'core.vsoft.restful', 'core.vsoft.BaseModel', 'ngCollection'])
    .factory('$fetchData', ['$baseModel', '$restful', '$q', '$collection', '$logger', 'Datastorage', function ($baseModel, $restful, $q, $collection, $logger, Datastorage) {

        $logger.moduleName = 'Fetch Data Factory';


        var fetchData;

        fetchData = {
            getData: function (tableName, start, limit, filters, sorters) {

                var _start, _limit, _filters, _sorters;

                var defer = $q.defer();
                var collection = $collection;
                var dataCollection = null;

                dataCollection = collection.getInstance();


                _start = start || 0;
                _limit = limit || 1000;
                _filters = JSON.stringify(filters) || null;
                _sorters = JSON.stringify(sorters) || null;


                $restful.get({table: tableName, start: _start, limit: _limit, filter: _filters, sort: _sorters}, function (resp) {
                    if (resp.success) {
                        var items = resp.data;
                        angular.forEach(items, function (item) {
                            var dataModel = new $baseModel(tableName, item);

                            dataCollection.add(dataModel);
                        });
                        dataCollection.total = resp.total;
                        defer.resolve(dataCollection);

                    } else {
                        defer.reject(resp.message);
                    }
                }, function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            }
        };
        return fetchData;
    }]);

/*
  .factory('fetchData', function () {
    // Service logic
    // ...

    var meaningOfLife = 42;

    // Public API here
    return {
      someMethod: function () {
        return meaningOfLife;
      }
    };
  });
*/