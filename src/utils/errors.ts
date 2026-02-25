export class ObiError extends Error {
	constructor(
		message: string,
		public code?: string,
		public data?: Record<string, unknown>,
	) {
		super(message);
		this.name = "ObiError";
	}
}

function handleError({ error }: { error: unknown }): never {
	let errorOutput: Record<string, unknown>;

	if (error instanceof ObiError && error.data) {
		errorOutput = { error: error.message, ...error.data };
	} else {
		const message = error instanceof Error ? error.message : String(error);
		errorOutput = { error: message };
	}

	console.error(JSON.stringify(errorOutput));
	process.exit(1);
}

// wrapCommand uses `any` for args because Commander passes variadic positional + options
// arguments and there is no way to type the spread generically without it
export function wrapCommand<T extends (...args: any[]) => Promise<any>>(
	fn: T,
): T {
	return (async (...args: any[]) => {
		try {
			await fn(...args);
		} catch (error) {
			handleError({ error });
		}
	}) as T;
}
