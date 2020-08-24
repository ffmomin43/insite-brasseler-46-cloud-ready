module insite.core {
    "use strict";

    export class HttpWrapperService {
        static $inject = ["$http", "$q"];

        constructor(protected $http: ng.IHttpService, protected $q: ng.IQService) {
        }

        executeHttpRequest<T>(caller: any, requestMethod: ng.IHttpPromise<T>, completedFunction: Function, failedFunction: Function): ng.IPromise<T> {
            const deferred = this.$q.defer();
            requestMethod
                .then(
                    (response: ng.IHttpPromiseCallbackArg<T>) => {
                        completedFunction.call(caller, response);
                        deferred.resolve(response.data);
                    },
                    (error: ng.IHttpPromiseCallbackArg<any>) => {
                        failedFunction.call(caller, error);
                        (<any>deferred).reject(error.data, error.status);
                    });
            return deferred.promise as any;
        }
    }

    angular
        .module("insite")
        .service("httpWrapperService", HttpWrapperService);
}