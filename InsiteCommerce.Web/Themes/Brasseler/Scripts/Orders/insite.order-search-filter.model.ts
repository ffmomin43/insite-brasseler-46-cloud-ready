module insite.order {
    "use strict";

    export class OrderSearchFilter implements order.ISearchFilter {
        customerSequence: string;
        sort: string;
        toDate: string;
        fromDate: string;
        expand: string;
        ponumber: string;
        ordernumber: string;
        search: string;
        ordertotaloperator: string;
        ordertotal: string;
        status: string[];
        statusDisplay: string;
        productErpNumber: string;
    }
}