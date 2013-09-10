'use strict';

angular.module('opd.admission').factory('initialization', ['$rootScope', '$q', 'configurationService',
        function ($rootScope, $q, configurationService) {
            var deferrable = $q.defer();
            var cfgs = configurationService.getConfigurations(['bahmniConfiguration', 'encounterConfig']);
            cfgs.then(function(configurations) {
                $rootScope.bahmniConfiguration = configurations.bahmniConfiguration;
                $rootScope.encounterConfig = configurations.encounterConfig;
                deferrable.resolve();
            });
            return deferrable.promise;
     }]
);    