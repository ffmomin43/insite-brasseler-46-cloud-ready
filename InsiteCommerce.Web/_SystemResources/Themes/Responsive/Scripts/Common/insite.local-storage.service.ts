module insite.common {
    "use strict";

    export interface IWindowStorage {
        set(key: string, value: string): void;
        get(key: string, defaultValue?: string): string;
        setObject(key: string, value: any): void;
        getObject(key: string, defaultValue?: any): any;
        remove(key: string): void;
        removeAll(): void;
        count(): number;
        getKeys(): string[];
    }

    export class WindowLocalStorage implements IWindowStorage {
        static $inject = ["$window"];

        constructor(protected $window: ng.IWindowService) {
        }

        set(key: string, value: string): void {
            this.$window.localStorage.setItem(key, value);
        }

        get(key: string, defaultValue?: string): string {
            return this.$window.localStorage.getItem(key) || defaultValue;
        }

        setObject(key: string, value: any): void {
            this.$window.localStorage.setItem(key, JSON.stringify(value));
        }

        getObject(key: string, defaultValue?: any): any {
            const val = this.$window.localStorage.getItem(key);
            if (val) {
                return JSON.parse(val);
            }
            return defaultValue;
        }

        remove(key: string): void {
            delete this.$window.localStorage[key];
        }

        removeAll(): void {
            this.$window.localStorage.clear();
        }

        count(): number {
            return this.$window.localStorage.length;
        }

        getKeys(): string[] {
            const keys = [];
            for (let x = 0; x < this.$window.localStorage.length; x++) {
                keys.push(this.$window.localStorage.key(x));
            }
            return keys;
        }
    }

    angular
        .module("insite-common")
        .service("$localStorage", WindowLocalStorage);
}