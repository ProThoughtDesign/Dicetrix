export class Logger {
    static Active = false;
    static log(message) {
        if (!Logger.Active)
            return;
        // eslint-disable-next-line no-console
        console.log(message);
    }
    // Helper for temporarily disabling logging in a function
    static withSilentLogging(fn) {
        const wasActive = Logger.Active;
        Logger.Active = false;
        try {
            return fn();
        }
        finally {
            Logger.Active = wasActive;
        }
    }
    // Helper for temporarily disabling logging in an async function
    static async withSilentLoggingAsync(fn) {
        const wasActive = Logger.Active;
        Logger.Active = false;
        try {
            return await fn();
        }
        finally {
            Logger.Active = wasActive;
        }
    }
}
export default Logger;
//# sourceMappingURL=Logger.js.map