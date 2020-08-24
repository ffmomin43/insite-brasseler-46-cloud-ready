module insite.rfq {
    "use strict";

    // this can't be generated, typelite does not like the calculationMethod enum
    export interface QuoteParameter {
        quoteId: string;
        status: string;
        note: string;
        userId: System.Guid;
        expirationDate: Date;
        calculationMethod: string;
        percent: number;
        isJobQuote: boolean;
        jobName: string;
        orderQuantities: QuoteLineModel[];
    }
}