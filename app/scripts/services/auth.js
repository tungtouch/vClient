'use strict';
/**
 * @ngdoc service
 * @name auth
 * @description
 *  Tổng quan về xác thực người dùng
 */

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
