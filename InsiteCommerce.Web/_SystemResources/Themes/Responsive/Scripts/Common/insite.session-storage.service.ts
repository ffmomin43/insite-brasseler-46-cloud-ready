module insite.common {
    "use strict";

    export class WindowSessionStorage implements IWindowStorage {
        static $inject = ["$window"];

        constructor(protected $window: ng.IWindowService) {
        }

        set(key: string, value: string): void {
            this.$window.sessionStorage[key] = value;
        }

        get(key: string, defaultValue: string): string {
            return this.$window.sessionStorage[key] || defaultValue;
        }

        setObject(key: string, value: any): void {
            this.$window.sessionStorage[key] = JSON.stringify(value);
        }

        getObject(key: string, defaultValue?: any): any {
            const val = this.$window.sessionStorage.getItem(key);
            if (val) {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    console.log(`Can't parse: ${val}`);
                }
            }
            return defaultValue;
        }

        remove(key: string): void {
            delete this.$window.sessionStorage[key];
        }

        removeAll(): void {
            this.$window.sessionStorage.clear();
        }

        count(): number {
            return this.$window.sessionStorage.length;
        }

        getKeys(): string[] {
            const keys = [];
            for (let x = 0; x < this.$window.sessionStorage.length; x++) {
                keys.push(this.$window.sessionStorage.key(x));
            }
            return keys;
        }
    }

    angular
        .module("insite-common")
        .service("$sessionStorage", WindowSessionStorage);
}