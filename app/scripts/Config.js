/**
 * Created by taipham.it on 7/15/2014.
 */


/**
 * @ngdoc service
 * @name appConfig
 * @description
 * Làm việc cấu hình hệ thống
 * @example
 * ```
 deviceID : {String}  mã ID của thiết bị //
 defaultPass : {String}  pass của thiết bị || null
 apiHost : {String}  địa chỉ hosting // apiHost : 'http://itaxi.vn'
 mediaHost : {String}  địa chỉ media hosting
 disableLog: {
            info: true, // true : tắt chức năng logger.info
            error: false, // false : Hiển thị
            debug: false
    }
 loginRouteServer: {String}, // server node.js route /login
 logoutRouterServer: {String},// server node.js route /logout
 registerRouterServer: {String},// server node.js route /register
 loginTableName: {String} // table name login users
 * ```
 *# Cấu hình roles :
 *
 *
 *###Xây dựng danh sách tất các các Roles bạn sử dụng trong App :
 *
 * ```
 roles: [
 'anon',
 'user'
 ]
 * ```
 *
 *
 *###Thiết lập tất cả các quyền truy cập mà bạn định ngĩa theo từng cấp độ sử dụng :
 *
 * ```
 accessLevels: {
      'anon': ['anon'],
      'user': ['user']
 }
 * ```
 * ### Export roles :
 * ```
 exports.userCan =
 {
     accessUser: exports.accessLevels.user // Export 1 roles 'user'
 };
 * ```
 * File app.js khai báo trong State quyền truy cập cao nhất mà roles đó có thể thực hiện
 *```
 accessLevel: window.userCan.accessUser
 *```
 * ####Ví dụ :
 * ```
 .state('main.home', {
                url: "",
                templateUrl: 'views/states/home.html',
                controller: 'homeCtrl',
                accessLevel: window.userCan.accessUser // Quyền User sẽ được truy cập
            })
 * ```
 */

angular.module('vClientApp.config', [])
    .constant('appConfig', {
        deviceId: (window.device) ? device.uuid.toLowerCase() : 'null',
        defaultPass: '',
        name: 'iTaxi',
        apiHost: 'http://localhost:1212',
        mediaHost: 'http://nodejs.vn:8080',

        // Làm việc với Logger
        disableLog: {
            info: false,
            error: false,
            debug: false
        },
        // Làm việc với Auth
        loginRouteServer: '/login',
        logoutRouterServer: '/logout',
        registerRouterServer: '/register',
        loginTableName: 'Users'
    }).
    service('dataStorage', ['$collection', function ($collection) {
        return {
            Users: $collection.getInstance()
        };
    }]);

// cấu hình Roles :


(function (exports) {

    var config = {

        roles: [
            'anon',
            'user'
        ],

        accessLevels: {
            'anon': ['anon'],
            'user': ['user']
        }

    };

    /*
     Method to build a distinct bit mask for each role
     It starts off with '1' and shifts the bit to the left for each element in the
     roles array parameter
     */
    function buildRoles(roles) {
        var bitMask = '01';
        var userRoles = {};

        for (var role in roles) {
            var intCode = parseInt(bitMask, 2);
            userRoles[roles[role]] = {
                bitMask: intCode,
                title: roles[role]
            };
            bitMask = (intCode << 1).toString(2);
        }

        return userRoles;
    }

    /*
     This method builds access level bit masks based on the accessLevelDeclaration parameter which must
     contain an array for each access level containing the allowed user roles.
     */
    function buildAccessLevels(accessLevelDeclarations, userRoles) {

        var accessLevels = {},
            resultBitMask,
            role;
        for (var level in accessLevelDeclarations) {

            if (typeof accessLevelDeclarations[level] === 'string') {
                if (accessLevelDeclarations[level] === '*') {

                    resultBitMask = '';

                    for (role in userRoles) {
                        resultBitMask += '1';
                    }
                    //accessLevels[level] = parseInt(resultBitMask, 2);
                    accessLevels[level] = {
                        bitMask: parseInt(resultBitMask, 2),
                        title: accessLevelDeclarations[level]
                    };
                }
                else {
                    //console.log('Access Control Error: Could not parse ' + accessLevelDeclarations[level] + ' as access definition for level ' + level);
                }
            }
            else {

                resultBitMask = 0;
                for (role in accessLevelDeclarations[level]) {
                    if (userRoles.hasOwnProperty(accessLevelDeclarations[level][role])) {
                        resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask;
                    }
                    else {
                        //console.log('Access Control Error: Could not find role ' + accessLevelDeclarations[level][role] + ' in registered roles while building access for ' + level );
                    }
                }
                accessLevels[level] = {
                    bitMask: resultBitMask,
                    title: accessLevelDeclarations[level][role]
                };
            }
        }

        return accessLevels;
    }


    exports.userRoles = buildRoles(config.roles);
    exports.accessLevels = buildAccessLevels(config.accessLevels, exports.userRoles);

    exports.userCan =
    {
        accessUser: exports.accessLevels.user
    };

})(typeof exports === 'undefined' ? window : exports);

