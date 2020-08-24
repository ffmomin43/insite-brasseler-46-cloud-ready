let errorLogger = (() => {
    window.javaScriptErrors = [];

    const pad = (value, length) => {
        value = value.toString();
        while (value.length < length) {
            value = `0${value}`;
        }
        return value;
    };

    window.recordError = errorMessage => {
        const now = new Date();
        const hours = pad(now.getHours(), 2);
        const minutes = pad(now.getMinutes(), 2);
        const seconds = pad(now.getSeconds(), 2);
        const milliseconds = pad(now.getMilliseconds(), 3);
        const nowString = `${hours}:${minutes}:${seconds}:${milliseconds}`;
        window.javaScriptErrors.push(`${nowString} - ${errorMessage}`);
    };

    window.onerror = errorMessage => {
        window.recordError(errorMessage as any);
    };
})();