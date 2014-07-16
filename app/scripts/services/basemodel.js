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

