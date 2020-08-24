var errorLogger = (function () {
    window.javaScriptErrors = [];
    var pad = function (value, length) {
        value = value.toString();
        while (value.length < length) {
            value = "0" + value;
        }
        return value;
    };
    window.recordError = function (errorMessage) {
        var now = new Date();
        var hours = pad(now.getHours(), 2);
        var minutes = pad(now.getMinutes(), 2);
        var seconds = pad(now.getSeconds(), 2);
        var milliseconds = pad(now.getMilliseconds(), 3);
        var nowString = hours + ":" + minutes + ":" + seconds + ":" + milliseconds;
        window.javaScriptErrors.push(nowString + " - " + errorMessage);
    };
    window.onerror = function (errorMessage) {
        window.recordError(errorMessage);
    };
})();
//# sourceMappingURL=insite.error-logger.js.map