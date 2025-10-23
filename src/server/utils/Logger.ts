export class Logger {
	static Active = true;
	static log(message: string): void {
		if (!Logger.Active) return;
		// eslint-disable-next-line no-console
		console.log(message);
	}
}

export default Logger;
