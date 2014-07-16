'use strict';

/**
 * @ngdoc service
 * @name $logger
 * @description
 * Làm việc với log của hệ thống,thay cho console.log của javascript các level log cũng như của console
 */

angular.module('vClientApp.logger', [])
    .constant('loggerConfig', {
        disableLog: {
            info: false,
            error: false,
            debug: false
        }
    })
    .factory('$logger', ['loggerConfig', function (loggerConfig) {


        var _stringify = function (args) {
            var msg = '';

            for (var i = 0; i < args.length; i++) {
                var item = args[i];

                if (angular.isString(item)) {
                    msg += item;
                } else {
                    msg += JSON.stringify(item, null, '\t') + ' ';
                }
            }

            return msg;
        };

        var _getDateTimeStr = function () {
            var date = new Date();
            var dateStr = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
            var timeStr = date.toLocaleTimeString();
            var result = dateStr + ' ' + timeStr;

            return result;
        };

        var _log = function (logLevel, args) {
            if (loggerConfig.disableLog[logLevel]) {
                return false;
            }

            var separator = ' - ';
            var separatorParam = ': ';

            var moduleName = this.moduleName;
            var functionName = args[0];
            var paramDisplay = args[1];

            args.splice(0, 1); //delete first element;
            args.splice(0, 1); //delete second element;

            var content = _stringify(args);
            var msg = _getDateTimeStr() + separator + moduleName + separator + functionName + separator + paramDisplay + separatorParam + content;

            console[this.functionName[logLevel]](msg);
        };

        // Publish API
        return {
            moduleName: 'NO MODULE',

            functionName: {info: 'info', error: 'error', debug: 'debug'},

            /**
             * @ngdoc service
             * @name $logger.info
             *
             * @description
             * log the messages into Info logging
             *
             * @param {String} functionName tên function mà bạn cần log
             * @param {String} displayParam Tên tham số bạn cần log
             * @param {Array/Object/String}  Values  trị hiện thị của tham số đó
             * @example
             * ```
             $logger.info('App controller','LoadData',data)
             * ```
             */
            info: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                angular.bind(this, _log, 'info', args)();
            },

            /**
             * @ngdoc service
             * @name $logger.error
             *
             * @description
             * log the messages into Error logging
             *
             * @param {String} functionName tên function mà bạn cần log
             * @param {String} displayParam Tên tham số bạn cần log
             * @param {Array/Object/String} Values Giá trị hiện thị của tham số đó
             * @example
             * ```
             $logger.error('App controller','LoadData',err);
             * ```
             */
            error: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                angular.bind(this, _log, 'error', args)();
            },

            /**
             * @ngdoc service
             * @name $logger.debug
             *
             * @description
             * log the messages into debug logging
             *
             * @param {String} functionName tên function mà bạn cần log
             * @param {String} displayParam Tên tham số bạn cần log
             * @param {Array/Object/String}  Values  trị hiện thị của tham số đó
             * @example
             * ```
                $logger.debug('App controller','LoadData',debug);
             *```
             */
            debug: function () {
                var args = Array.prototype.slice.call(arguments, 0);
                angular.bind(this, _log, 'debug', args)();
            }
        };
    }]);
