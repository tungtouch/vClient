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
 * ```
 */


angular.module('vClientApp.config', [])
    .constant('appConfig', {
        deviceId: (window.device) ? device.uuid.toLowerCase() : 'notDeviced',
        defaultPass: '',
        name: 'iTaxi',
        apiHost: 'http://itaxi.vn:6969',
        mediaHost: 'http://itaxi.vn:6969',
        disableLog: {
            info: false,
            error: false,
            debug: false
        }
    })