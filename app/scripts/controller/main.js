/**
 * Created by taipham.it on 7/15/2014.
 */
'use strict';

angular.module('vClientApp')
    .controller('MainCtrl', ['$scope', 'appConfig', '$fetchData', 'appData', '$upload', '$baseModel', '$logger', function ($scope, appConfig, $fetchData, appData, $upload, $baseModel, $logger) {
        var _id = '5397ca5dc0c8174642000001';
        $fetchData.getDataId('UserAuths', _id, 'Users').then(function (resp) {
            $logger.info('MainCtrl','load data',resp);
        }, function (err) {
            console.log('err :', err);
        });

        $scope.openFileSelect = function () {
            document.getElementById("mediaUpload").click();
        }

        $scope.onFileSelect = function ($files) {
            $logger.info('onFileSelect', 'start', true);

            //$files: an array of files selected, each file has name, size, and type.

            var file;

            for (var i = 0; i < $files.length; i++) {
                file = $files[i];
                $logger.info('onFileSelect', '$file', file);
                $scope.upload = $upload
                    .upload({
                        url: appConfig.mediaHost + '/upload', //upload.php script, node.js route, or servlet url
                        method: 'POST',// or PUT,
                        /*data: {tableName: 'menuData'},*/
                        file: file
                    })
                    .progress(function (evt) {
                        $logger.info('onFileSelect', 'percent', parseInt(100.0 * evt.loaded / evt.total));
                    }).success(function (data) { //.success(function(data, status, headers, config) {
                        $logger.debug('onFileSelect', 'data', data);

                        $scope.createStatusProcess = false;

                        if (data.success) {
                            $logger.info('onFileSelect', 'success', true);

                            $logger.info('onFileSelect', 'success', data.data.url);

                            /*
                             var newMedia = new $baseModel('Medias', {
                             media_url: data.data.url,
                             media_thumb: data.data.url
                             });

                             status.type = 'photo';

                             $scope.listMedia.unshift({
                             media_url: data.data.url,
                             media_thumb: data.data.url
                             });
                             newMedia.save(function (err, resp) {
                             if (!err) {
                             status.media.push(resp.id);
                             }
                             });*/

                        }
                    });
            }

        };

    }]);