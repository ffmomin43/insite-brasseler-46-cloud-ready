var insite;
(function (insite) {
    var common;
    (function (common) {
        "use strict";
        var WindowSessionStorage = /** @class */ (function () {
            function WindowSessionStorage($window) {
                this.$window = $window;
            }
            WindowSessionStorage.prototype.set = function (key, value) {
                this.$window.sessionStorage[key] = value;
            };
            WindowSessionStorage.prototype.get = function (key, defaultValue) {
                return this.$window.sessionStorage[key] || defaultValue;
            };
            WindowSessionStorage.prototype.setObject = function (key, value) {
                this.$window.sessionStorage[key] = JSON.stringify(value);
            };
            WindowSessionStorage.prototype.getObject = function (key, defaultValue) {
                var val = this.$window.sessionStorage.getItem(key);
                if (val) {
                    try {
                        return JSON.parse(val);
                    }
                    catch (e) {
                        console.log("Can't parse: " + val);
                    }
                }
                return defaultValue;
            };
            WindowSessionStorage.prototype.remove = function (key) {
                delete this.$window.sessionStorage[key];
            };
            WindowSessionStorage.prototype.removeAll = function () {
                this.$window.sessionStorage.clear();
            };
            WindowSessionStorage.prototype.count = function () {
                return this.$window.sessionStorage.length;
            };
            WindowSessionStorage.prototype.getKeys = function () {
                var keys = [];
                for (var x = 0; x < this.$window.sessionStorage.length; x++) {
                    keys.push(this.$window.sessionStorage.key(x));
                }
                return keys;
            };
            WindowSessionStorage.$inject = ["$window"];
            return WindowSessionStorage;
        }());
        common.WindowSessionStorage = WindowSessionStorage;
        angular
            .module("insite-common")
            .service("$sessionStorage", WindowSessionStorage);
    })(common = insite.common || (insite.common = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.session-storage.service.js.map