var insite;
(function (insite) {
    var common;
    (function (common) {
        "use strict";
        var WindowLocalStorage = /** @class */ (function () {
            function WindowLocalStorage($window) {
                this.$window = $window;
            }
            WindowLocalStorage.prototype.set = function (key, value) {
                this.$window.localStorage.setItem(key, value);
            };
            WindowLocalStorage.prototype.get = function (key, defaultValue) {
                return this.$window.localStorage.getItem(key) || defaultValue;
            };
            WindowLocalStorage.prototype.setObject = function (key, value) {
                this.$window.localStorage.setItem(key, JSON.stringify(value));
            };
            WindowLocalStorage.prototype.getObject = function (key, defaultValue) {
                var val = this.$window.localStorage.getItem(key);
                if (val) {
                    return JSON.parse(val);
                }
                return defaultValue;
            };
            WindowLocalStorage.prototype.remove = function (key) {
                delete this.$window.localStorage[key];
            };
            WindowLocalStorage.prototype.removeAll = function () {
                this.$window.localStorage.clear();
            };
            WindowLocalStorage.prototype.count = function () {
                return this.$window.localStorage.length;
            };
            WindowLocalStorage.prototype.getKeys = function () {
                var keys = [];
                for (var x = 0; x < this.$window.localStorage.length; x++) {
                    keys.push(this.$window.localStorage.key(x));
                }
                return keys;
            };
            WindowLocalStorage.$inject = ["$window"];
            return WindowLocalStorage;
        }());
        common.WindowLocalStorage = WindowLocalStorage;
        angular
            .module("insite-common")
            .service("$localStorage", WindowLocalStorage);
    })(common = insite.common || (insite.common = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.local-storage.service.js.map