/**
 * Created by taipham.it on 7/20/2014.
 */

angular.module('vClientApp').
    controller('loading', ['$rootScope', '$scope', 'appData', '$state', '$timeout', function ($rootScope, $scope, appData, $state, $timeout) {
        $timeout(function () {
            appData.load().then(function (resp) {
                $rootScope.statusLoaded = true;
                $state.go('main');
                /*if (resp.Users == null) {
                    alert('Không thể kết nối tới server xin vui lòng cấu hình lại mạng');
                } else {
                    $state.go('main');
                }*/
            }, function (err) {
                console.log('loading false');
            })
        }, 1000);

    }])
