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
 deviceID : mã ID của thiết bị
 defaultPass : pass của thiết bị || null
 apiHost : địa chỉ hosting
 mediaHost : địa chỉ media hosting
 * ```
 */


angular.module('vClientApp.config', [])
    .constant('appConfig', {

        deviceId: (window.device) ? device.uuid.toLowerCase() : 'notDeviced',
        defaultPass: '',
        name: 'iTaxi',
        apiHost: 'http://itaxi.vn:6969',
        mediaHost: 'http://itaxi.vn:6969'
    })