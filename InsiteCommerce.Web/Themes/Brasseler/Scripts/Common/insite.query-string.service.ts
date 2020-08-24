module insite.common {
    "use strict";

    export interface IQueryStringService {
        get(key: string);
    }

    export class QueryStringService implements IQueryStringService {
        get(key: string): string {
            key = key.toLowerCase().replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            const regex = new RegExp(`[\\?&]${key}=([^&#]*)`, "i");
            const results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }

    angular
        .module("insite-common")
        .service("queryString", QueryStringService);
}