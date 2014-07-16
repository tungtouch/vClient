'use strict';

/**
 * @ngdoc service
 * @name fetchData
 * @description
 * $fetchData dùng để lấy dữ liệu,Mỗi dữ liệu được trả về là 1 thuộc tính BaseModel (đối tượng này sẽ có đầy đủ các phương thức save,update,delete,create khi truy vấn)
 */

angular.module('vClientApp.fetchData', ['vClientApp.logger', 'vClientApp.restful', 'vClientApp.baseModel'])
    .factory('$fetchData', ['$baseModel', '$restful', '$q', '$collection', '$logger', function ($baseModel, $restful, $q, $collection, $logger) {

        $logger.moduleName = 'Fetch Data Factory';


        var fetchData;


        /**
         *@ngdoc service
         *@name fetchData.getData
         *
         *@description
         *Lấy dữ liệu từ service
         *
         *@param {String} TableName tên bảng cần lấy dữ liệu
         *@param {number} Start Lấy phần tử từ vị trí || để null mặc định 0
         *@param {number} Limit tối đa phần tử được lấy || để null mặc định 1000
         *@param {Array}  Filters Lọc theo điều kiện || null
         *@param {Array}  Sorters Sắp xếp || null
         *@example
         * `var sorters = [{property: 'startAt', direction: 'DESC'}];`
         * @example
         *
         * ```
         $fetchData.getData('users', null, null, null, null).then(function (resp) {
                console.log('data Users : '), resp.all();

             }, function (err) {
                console.log('err : ', err);
         })
         *
         * ```
         */

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

