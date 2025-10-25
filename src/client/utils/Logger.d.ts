export declare class Logger {
    static Active: boolean;
    static log(message: string): void;
    static withSilentLogging<T>(fn: () => T): T;
    static withSilentLoggingAsync<T>(fn: () => Promise<T>): Promise<T>;
}
export default Logger;
