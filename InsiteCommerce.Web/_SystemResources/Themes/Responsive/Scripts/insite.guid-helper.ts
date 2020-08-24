/* tslint:disable */
class guidHelper {
/* tslint:enable */
    static isGuid(value: string, allowNull?: boolean): boolean {
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(value) || allowNull && value === null;
    }

    static isEmptyGuid(value: string): boolean {
        return value === "00000000-0000-0000-0000-000000000000";
    }

    static emptyGuid(): string {
        return "00000000-0000-0000-0000-000000000000";
    }

    static generateGuid(): string {
        /* tslint:disable no-bitwise */
        const guidTemplate = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        const hex = "0123456789abcdef";
        let random = 0;
        let result = "";
        for (let i = 0; i < 36; i++) {
            if (guidTemplate[i] !== "-" && guidTemplate[i] !== "4") {
                // each x and y needs to be random
                random = Math.random() * 16 | 0;
            }

            if (guidTemplate[i] === "x") {
                result += hex[random];
            } else if (guidTemplate[i] === "y") {
                // clock-seq-and-reserved first hex is filtered and remaining hex values are random
                random &= 0x3; // bit and with 0011 to set pos 2 to zero ?0??
                random |= 0x8; // set pos 3 to 1 as 1???
                result += hex[random];
            } else {
                result += guidTemplate[i];
            }
        }

        return result;
        /* tslint:enable no-bitwise */
    }
}