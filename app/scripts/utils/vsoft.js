'use strict';
/**
 * @ngdoc service
 * @name auth
 * @description
 *  Tổng quan về xác thực người dùng
 */
angular.module('vFramework', [
    'vClientApp.config',
    'vClientApp.restful',
    'vClientApp.logger',
    'vClientApp.baseModel',
    'vClientApp.fetchData',
    'vClientApp.socket',
    'vClientApp.auth'
]);

angular.module('vClientApp.auth', ['vClientApp.logger', 'vClientApp.restful', 'vClientApp.fetchData', 'vClientApp.config'])
    .factory('$auth', ['$resource', '$http', '$cookieStore', '$rootScope', 'localStorageService', '$logger', '$q', 'appConfig', '$fetchData', '$restful',
        function ($resource, $http, $cookieStore, $rootScope, localStorageService, $logger, $q, appConfig, $fetchData, $restful) {


            $logger.moduleName = 'Auth Factory';

            var _userKey = 'user';
            var _tokenKey = 'token';
            var _lastLoginNameKey = 'lastLoginName';
            var _authorizationKey = 'Authorization';


            var _setHeaderToken = function (token) {
                $http.defaults.headers.common[_authorizationKey] = token;

                $logger.info('_setHeaderToken', 'done', true);
            };

            var _clearHeaderToken = function () {
                $http.defaults.headers.common[_authorizationKey] = null;

                $logger.info('_clearHeaderToken', 'done', true);
            };

            // Public API Here
            return {
                pendingStateChange: null,

                clearCurrentUser: function () {
                    this.clearUser();
                    $logger.info('clearCurrentUser', 'done', true);
                },

                setCurrentUser: function (user) {
                    user.nextState = 'nodejs.main.home';

                    this.setUser(user);

                    $logger.info('setCurrentUser', 'done', true);
                },

                /**
                 * @ngdoc service
                 * @name auth.getCurrentUser
                 * @example
                 * ```
                 $auth.getCurrentUser()
                 * ```
                 *
                 * */
                getCurrentUser: function () {
                    var user = this.getUser();
                    var userRole = this.getUserRole();

                    if (user && userRole) {
                        if (userRole.title === 'admin' || userRole.title === 'manager') {
                            user.nextState = 'nodejs.admin';
                        }
                        if (userRole.title === 'user') {
                            user.nextState = 'nodejs.main.home';
                        }
                        if (userRole.title === 'kitchen' || userRole.title === 'bar') {
                            user.nextState = 'bell.monitor-bar.monitor';
                        }
                    }

                    $logger.info('getCurrentUser', 'done', true);
                    return user;
                },
                clearUser: function () {
                    /*this.user = null;*/
                    //localStorageService.set(_userKey, null);
                    localStorageService.remove(_userKey);

                    //localStorageService.set(_userKey, null);
                },

                /*
                 setUser: function (user) {
                 this.user = user;
                 },
                 */

                setUser: function (user) {
                    localStorageService.set(_userKey, JSON.stringify(user));

                    //sessionStorage[_userKey] = JSON.stringify(user);
                    //localStorageService.set(_userKey, user);
                },

                /*
                 getUser: function () {
                 return this.user || null;

                 },
                 */

                getUser: function () {
                    var cachedUser = localStorageService.get(_userKey);

                    //var cachedUser = localStorageService.get(_userKey);

                    if (!!cachedUser) {
                        return cachedUser;
                    }

                    return null;

                },
                setToken: function (token) {
                    if (token) {
                        _setHeaderToken(token);
                        localStorageService.set(_tokenKey, token);
                    } else {
                        _setHeaderToken(null);
                        localStorageService.set(_tokenKey, null);
                    }

                    //sessionStorage[_tokenKey] = token;
                    //localStorageService.set(_tokenKey, token);
                },

                getToken: function () {
                    return localStorageService.get(_tokenKey);
                },

                clearToken: function () {
                    _clearHeaderToken();
                    localStorageService.set(_tokenKey, null);
                    //localStorageService.set(_tokenKey, null);
                },

                setHeaderToken: function () {
                    var token = this.getToken();

                    if (token) {
                        _setHeaderToken(token);
                    } else {
                        _setHeaderToken(null);
                    }

                    $logger.info('setHeaderToken', 'done', true);
                },
                getHeaderToken: function () {
                    var token = $http.defaults.headers.common[_authorizationKey];
                    if (token) {
                        return token;
                    } else {
                        return null;
                    }
                },

                assignSocketIoEvent: function (callBack) {
                    var me = this;
                    window.socketIo.on('connect', function () {

                        $logger.info('connectSocketIo', 'established a working and authorized connection success', true);

                        callBack(true);
                    });

                    window.socketIo.on('disconnect', function () {
                        $logger.info('connectSocketIo', 'disconnect by some reason', true);
                    });

                    window.socketIo.on('error', function (reason) {
                        $logger.error('connectSocketIo', 'error', reason);

                        callBack(false);
                    });
                },

                connectSocketIo: function (callBack) {
                    $logger.info('connectSocketIo', 'starting', true);

                    /*var token = this.getToken();*/
                    var token = this.getHeaderToken();

                    if (!window.socketIo) {
                        $logger.info('connectSocketIo', 'connect first time', true);
                        window.socketIo = window.io.connect(appConfig.apiHost + '/?token=' + token, {'force new connection': true});

                        window.socketIo.emit('user:connect', {
                            userId: this.getUserId()
                        });

                        this.assignSocketIoEvent(callBack);
                    } else {
                        window.socketIo.disconnect();
                        $logger.info('connectSocketIo', 'disconnect', true);

                        window.socketIo = window.io.connect(appConfig.apiHost + '/?token=' + token, {'force new connection': true});
                        $logger.info('connectSocketIo', 're-connect', true);

                        window.socketIo.emit('user:connect', {
                            userId: this.getUserId()
                        });

                        this.assignSocketIoEvent(callBack);
                    }


                },

                resolvePendingState: function (httpPromise) {
                    var _functionName = 'resolvePendingState';
                    $logger.info(_functionName, 'starting', true);

                    var checkUser = $q.defer();
                    var me = this;
                    var pendingState = me.pendingStateChange;

                    httpPromise
                        .success(function (data) {
                            if (data.success) {
                                me.setCurrentUser(data.user);

                                if (pendingState.to.accessLevel === undefined || me.authorize(pendingState.to.accessLevel)) {
                                    $logger.info(_functionName, 'success and authorized', true);

                                    checkUser.resolve();
                                } else {
                                    $logger.info(_functionName, 'success BUT Unauthorized', true);

                                    checkUser.reject('unauthorized'); // may be 403
                                }
                            } else {
                                checkUser.reject('401');

                                $logger.info(_functionName, 'error', data.message);
                            }
                        })
                        .error(function (err, status, headers, config) {
                            checkUser.reject(status.toString());

                            $logger.info(_functionName, 'error', err);
                        });

                    me.pendingStateChange = null;
                    return checkUser.promise;
                },
                register: function (data, cb) {
                    var me = this;
                  /*  var registerData = {
                        username: data.username,
                        password: data.password,
                        email: data.email,
                        sex: data.sex,
                        firstname: data.firstname,
                        lastname: data.lastname
                    };*/
                    $http(
                        {
                            'method': 'POST',
                            'data': data, // registerData
                            'url': appConfig.apiHost + appConfig.registerRouterServer
                        })
                        .success(function (data) {
                            /*console.log('data', data);*/
                            //me.setAppRegister(data.data);
                            cb(null, data);
                        })
                        .error(function (err) {
                            cb(err, null);
                        });
                },
                /**
                 * @ngdoc service
                 * @name auth.getUserInfoById
                 *
                 * @description
                 * Lấy thông tin user theo ID
                 * @param {String} id ID của user cần lấy
                 * @example
                 * ```
                 $auth.getUserInfoById('5128182120012006212');
                 ```
                 * */

                getUserInfoById: function (id, cb) {

                    $restful.get({table: appConfig.loginTableName, id: id}, function (resp) {
                        if (resp.success) {
                            cb(null, resp.data);
                        } else {
                            cb(resp.message, null);
                        }
                    });

                },
                login: function (username, password, cb) {
                    var me = this;

                    $rootScope.crudProcessing = true;
                    $http(
                        {
                            'method': 'POST',
                            'data': {'username': username, 'password': password},
                            'url': appConfig.apiHost + appConfig.loginRouteServer
                        })
                        .success(function (data) { //.success(function(data, status, headers, config)
                            $logger.info('login', 'success', true);

                            var user = data.user;
                            var token = data.token;


                            me.setCurrentUser(user);
                            me.setToken(token);
                            me.setLastLoginName();

                            me.pendingStateChange = null;

                            cb(null, data);
                        })
                        .error(function (err) {

                            $rootScope.crudProcessing = false;
                            $rootScope.loginError = err;

                            cb(err, null);
                        });
                },

                logout: function (callBack) {
                    var me = this;
                    $rootScope.logoutProcessing = true;

                    $http(
                        {
                            'method': 'POST',
                            'url': appConfig.apiHost + appConfig.logoutRouterServer
                        })
                        .success(function (data) {
                            $logger.info('logout', 'success', true);

                            me.clearCurrentUser();
                            me.clearToken();
                            if (window.socketIo) {
                                window.socketIo.disconnect();
                            }

                            $logger.info('Authorize', 'logout', true);
                            $logger.info('Authorize', 'logout', me.getToken());


                            $rootScope.logoutProcessing = false;

                            callBack(true);
                        })
                        .error(function (err) {
                            $logger.error('logout', 'error', err);
                            $logger.info('Authorize', 'logout', false);
                            $rootScope.logoutProcessing = false;

                            callBack(false);
                        });
                },

                setLastLoginName: function () {
                    localStorageService.set(_lastLoginNameKey, this.getUserName());
                },

                getLastLoginName: function () {
                    return localStorageService.get(_lastLoginNameKey);
                },


                /**
                 * @ngdoc service
                 * @name auth.getUserId
                 *
                 * @description
                 * Lấy thông tin ID của user
                 *
                 * @example
                 * ```
                 $auth.getUserId();
                 *```
                 * */
                getUserId: function () {
                    var user = this.getUser();

                    if (!!user) {
                        return user.id;
                    }
                    return '';
                },
                /**
                 * @ngdoc service
                 * @name auth.getUserName
                 *
                 * @description
                 * Lấy thông tin tên của user
                 *
                 * @example
                 * ```
                 $auth.getUserName();
                 * ```
                 * */

                getUserName: function () {
                    var user = this.getUser();

                    if (!!user) {
                        return user.name;
                    }
                    return '';
                },
                /**
                 * @ngdoc service
                 * @name auth.getUserFullName
                 *
                 * @description
                 * Lấy thông tin tên đầy đủ của user
                 *
                 * @example
                 * ```
                 $auth.getUserFullName();
                 * ```
                 * */
                getUserFullName: function () {
                    var user = this.getUser();

                    if (!!user) {
                        return user.fullname;
                    }
                    return '';
                },
                /**
                 * @ngdoc service
                 * @name auth.getUserRole
                 *
                 * @description
                 * Lấy role của User
                 *
                 * @example
                 * ```
                 $auth.getUserRole();
                 *```
                 * */

                getUserRole: function () {
                    var user = this.getUser();

                    if (!!user) {
                        return user.role;
                    }

                    return null;
                },

                getUserSite: function () {
                    var user = this.getUser();

                    if (!!user && user.site) {
                        return user.site;
                    }
                    return null;
                },

                authorize: function (accessLevel) {

                    var userRole = this.getUserRole();
                    if (null !== userRole) {
                        var result = accessLevel.bitMask <= userRole.bitMask;
                        return result;
                    } else {
                        return false;
                    }
                },

                /**
                 * @ngdoc service
                 * @name auth.isLogin
                 *
                 * @description
                 * Trạng thái của login
                 * @returns {boolean} lấy thông tin
                 *
                 * - `{object}` `info()` — Returns id, size, and options of cache.
                 * - `{{*}}` `put({string} key, {*} value)` — Puts a new key-value pair into the cache and returns
                 *   it.
                 * - `{{*}}` `get({string} key)` — Returns cached value for `key` or undefined for cache miss.
                 * - `{void}` `remove({string} key)` — Removes a key-value pair from the cache.
                 * - `{void}` `removeAll()` — Removes all cached values.
                 * - `{void}` `destroy()` — Removes references to this cache from $cacheFactory.
                 *
                 * @example
                 * `$auth.isLogin();`
                 * */
                isLogin: function () {
                    var userRole = this.getUserRole();

                    return (userRole) ? true : false;
                }

            };
        }]);

'use strict';

angular.module('vClientApp.baseModel',['vClientApp.logger', 'vClientApp.restful'])
    .factory('$baseModel', ['$resource', '$http', '$cookieStore', '$rootScope', '$logger', '$window', '$restful', function ($resource, $http, $cookieStore, $rootScope, $logger, $window, $restful) {
        $logger.moduleName = 'BaseModel Factory';

        var BaseModel = function (tableName, data) {
            this.omitFields = ['omitFields', 'tableName', 'busy', 'cid', 'acceptSocket'];
            this.tableName = tableName;
            this.busy = false;
            this.acceptSocket = false;
            this.socketData = {};
            //this.cid = window.uuid.v4();

            var me = this;
            angular.extend(me, data);
        };



        BaseModel.prototype.save = function (callback) {
            $logger.info('save model', 'start', true);

            var me = this;
            var _isNew = false;

            if (me.busy) {
                return;
            }
            me.busy = true;

            if (me.id) {
                _isNew = false;
            } else {
                _isNew = true;
            }

            var saveData = window._.omit(me, me.omitFields);

            if (_isNew) {
                $logger.info('$restful save', 'start', true);
                $restful.save({table: me.tableName}, saveData, function (resp) {
                    me.busy = false;

                    if (resp.success) {
                        me._id = resp.data._id;
                        me.id = me._id;
                        if (me.acceptSocket) {
                            console.log('$restful save', 'acceptSocket', true);

                            var socketData = {
                                table: me.tableName,
                                action: 'create',
                                id: resp.data._id
                            };

                            if (me.socketData) {
                                socketData = window._.extend(socketData, me.socketData);
                            }

                            window.socketIo.emit('socket', socketData);
                        }
                    } else {
                        //var errMsg = resp.message;
                        //TODO: send or broadcast errMsg to somewhere

                    }

                    $logger.info('create new model', 'resp', resp);

                    if (callback) {
                        callback(resp.success ? null : resp.message, resp.data);
                    }
                });
            } else {
                $logger.info('$restful put', 'start', true);
                $restful.put({table: me.tableName, id: me.id}, saveData, function (resp) {
                    me.busy = false;

                    if (resp.success) {
                        if (me.acceptSocket) {
                            console.log('$restful put', 'acceptSocket', true);
                            var socketData = {
                                table: me.tableName,
                                action: 'update',
                                id: resp.data.id
                            };

                            if (me.socketData) {
                                socketData = window._.extend(socketData, me.socketData);
                            }

                            window.socketIo.emit('socket', socketData);
                        }
                        //TODO:
                    } else {
                        //var errMsg = resp.message;
                        //TODO: send or broadcast errMsg to somewhere
                    }

                    $logger.info('update existing model', 'resp', resp);

                    if (callback) {
                        callback(resp.success ? null : resp.message, resp.data);
                    }
                });
            }
        };

        BaseModel.prototype.destroy = function (callback) {
            var me = this;

            if (me.busy) {
                return;
            }
            me.busy = true;


            $restful.delete({table: me.tableName, id: me.id}, function (resp) {
                me.busy = false;

                if (resp.success) {

                    if (me.acceptSocket) {
                        var socketData = {
                            table: me.tableName,
                            action: 'delete',
                            id: resp.data.id
                        };

                        if (me.socketData) {
                            socketData = window._.extend(socketData, me.socketData);
                        }

                        window.socketIo.emit('socket', socketData);
                    }

                    if (callback) {
                        callback(null, resp.data);
                    }
                } else {
                    //var errMsg = resp.message;
                    //TODO: send or broadcast errMsg to somewhere
                    if (callback) {
                        callback(resp.message, null);
                    }
                }

                $logger.info('delete model', 'resp', resp);
            });
        };

        return BaseModel;
    }]);


'use strict';

/**
 * @ngdoc service
 * @name fetchData
 * @description
 * $fetchData dùng để lấy dữ liệu,Mỗi dữ liệu được trả về là 1 thuộc tính BaseModel (đối tượng này sẽ có đầy đủ các phương thức save,update,delete,create khi truy vấn)
 */

angular.module('vClientApp.fetchData', ['vClientApp.logger', 'vClientApp.restful', 'vClientApp.baseModel'])
    .factory('$fetchData', ['$baseModel', '$restful', '$q', '$collection', '$logger', 'dataStorage', function ($baseModel, $restful, $q, $collection, $logger, dataStorage) {

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
         * Example : sắp xếp các giá trị và lọc theo giá trị
         * ```
         var filters = [
         {
             property: 'driver', // thuộc tính Driver
             value: userId, // lọc lấy theo ID
             type: 'string',
             comparison: 'eq' // so sánh bằng...
         }
         ];

         var sorters = [
         {
             property: 'startAt', // sắp xếp theo ngày bắt đầu - đây là 1 kiểu thời gian
             direction: 'DESC' // kiểu sắp xếp
         }
         ];

         $fetchData.getData('RouteHistories', null, null, filters, sorters).then(function (resp) {
                console.log('RouteHistories', $scope.RouteHistories);
            }, function (err) {
                console.log('err : ', err);
            })
         ```
         */


        /**
         *@ngdoc service
         *@name fetchData.getDataId
         *
         *@description
         *Lấy dữ liệu từ service
         *
         *@param {String} TableName tên bảng cần lấy dữ liệu
         *@param {String} Id của đối tượng cần lấy
         *@param {String} NameStogare dataStorage truyền vào || null (để null sẽ lấy từ server)
         *@example
         *```
         $fetchData.getDataId('UserAuths', '5397ca5dc0c8174642000001').then(function(resp){
                console.log('data : ',resp);
                },function(err){
                console.log('err :',err);
         });
         *```
         *
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
            },
            getDataId: function (tableName, id, dataCollection) {
                var defer = $q.defer();
                if (!angular.isString(tableName) || !angular.isString(id)) {
                    defer.reject('tableName or id required String');
                } else {

                    if (dataCollection && !angular.isUndefined(dataStorage[dataCollection]) && dataStorage[dataCollection].size() > 0) {
                        defer.resolve(dataStorage[dataCollection].get(id));
                        $logger.info('', 'Get data from Storage', dataStorage[dataCollection].get(id));
                    } else {
                        if (dataCollection) {
                            console.log('Name', dataCollection + ' Storage false or Storage null');
                        }
                        $restful.get({table: tableName, id: id}, function (resp) {
                            var data = new $baseModel(tableName, resp.data);
                            defer.resolve(data);
                            $logger.info('', 'Get data from server', data);
                        }, function (err) {
                            defer.reject(err);
                        })
                    }

                }
                return defer.promise;
            }
        };
        return fetchData;
    }]);


'use strict';

/**
 * @ngdoc service
 * @name $logger
 * @description
 * Làm việc với log của hệ thống,thay cho console.log của javascript các level log cũng như của console
 */

angular.module('vClientApp.logger', ['vClientApp.config'])

    .factory('$logger', ['appConfig', function (appConfig) {


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
            if (appConfig.disableLog[logLevel]) {
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
             * Hiển thị các thông tin logger info (Tắt chức năng logger xem ở Config)
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
             * Hiển thị thông tin logger lỗi (Tắt chức năng logger xem ở Config)
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
             * Hiển thị thông tin logger debug (Tắt chức năng logger xem ở Config)
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
'use strict';

angular.module('vClientApp.socket',[])
    .factory('$socket', function ($rootScope) {
        var socket = window.socketIo;
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    });
