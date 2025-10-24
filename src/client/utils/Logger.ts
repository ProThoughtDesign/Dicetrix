export class Logger {
	static Active = true;
	static log(message: string): void {
		if (!Logger.Active) return;
		// eslint-disable-next-line no-console
		console.log(message);
	}

	// Helper for temporarily disabling logging in a function
	static withSilentLogging<T>(fn: () => T): T {
		const wasActive = Logger.Active;
		Logger.Active = false;
		try {
			return fn();
		} finally {
			Logger.Active = wasActive;
		}
	}

	// Helper for temporarily disabling logging in an async function
	static async withSilentLoggingAsync<T>(fn: () => Promise<T>): Promise<T> {
		const wasActive = Logger.Active;
		Logger.Active = false;
		try {
			return await fn();
		} finally {
			Logger.Active = wasActive;
		}
	}
}

export default Logger;
