export class Logger {
  static Active = true;

  static log(message: string): void {
    if (!Logger.Active) return;
    // Default behavior: forward to console.log
    // Could be extended to send to remote logging or files.
    // Keep API minimal as requested.
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

export default Logger;
