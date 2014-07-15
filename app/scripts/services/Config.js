/**
 * Created by taipham.it on 7/15/2014.
 */

angular.module('vClientApp.config', [])
    .constant('appConfig', {
        deviceId: (window.device) ? device.uuid.toLowerCase() : 'what.do.namehihi????',
        defaultPass: '',
        name: 'iTaxi',
        apiHost: 'http://nodejs.vn:1212', // taxigo.vn:9697
        mediaHost: 'http://vsoft.vn:1235'
    })