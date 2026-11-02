declare const __VERSION__: string;

export const DEFAULT_BASE_URL = "https://api.cleave.fi";
export const DEFAULT_TIMEOUT_MS = 30_000;
const USER_AGENT = `cleave-ai-sdk/${__VERSION__}`;

export type ToolEndpoint = "plan_swap" | "track_swap" | "find_token" | "get_gas";

export interface CleaveToolsOptions {
	baseUrl?: string;
	apiKey?: string;
	timeoutMs?: number;
	fetch?: typeof globalThis.fetch;
	getGasApproval?: boolean;
}

export type CleaveResult = Record<string, unknown>;

export class CleaveApiError extends Error {
	readonly status: number;
	readonly requestId: string | null;

	constructor(message: string, status: number, requestId: string | null = null, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "CleaveApiError";
		this.status = status;
		this.requestId = requestId;
	}
}

function untilAborted(signal: AbortSignal): Promise<never> {
	return new Promise((_, reject) => {
		if (signal.aborted) reject(signal.reason);
		else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
	});
}

function httpError(status: number): CleaveResult {
	return { error: { code: "http_error", message: `HTTP ${status}`, retryable: status >= 500 || status === 429 } };
}

export async function callTool(endpoint: ToolEndpoint, input: object, options: CleaveToolsOptions, abortSignal?: AbortSignal): Promise<CleaveResult> {
	const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json", "user-agent": USER_AGENT };
	if (options.apiKey !== undefined && options.apiKey !== "") headers.authorization = `Bearer ${options.apiKey}`;
	const doFetch = options.fetch ?? globalThis.fetch;
	const timeout = AbortSignal.timeout(timeoutMs);
	const signal = abortSignal === undefined ? timeout : AbortSignal.any([abortSignal, timeout]);
	const stopped = untilAborted(signal);
	stopped.catch(() => undefined);
	let response: Response;
	let text: string;
	try {
		response = await Promise.race([doFetch(`${base}/agent/v1/${endpoint}`, { method: "POST", headers, body: JSON.stringify(input), signal }), stopped]);
		text = await Promise.race([response.text(), stopped]);
	} catch (err) {
		const message = abortSignal?.aborted ? "The Cleave API call was aborted" : timeout.aborted ? `Cleave API did not answer within ${timeoutMs} ms` : "Cleave API could not be reached";
		throw new CleaveApiError(message, 0, null, { cause: err });
	}
	const requestId = response.headers.get("x-request-id");
	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch (err) {
		if (!response.ok) return httpError(response.status);
		throw new CleaveApiError(`Cleave API answered HTTP ${response.status} without a JSON body`, response.status, requestId, { cause: err });
	}
	const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
	if (!response.ok) return isObject(body) && isObject(body.error) ? body : httpError(response.status);
	if (!isObject(body)) throw new CleaveApiError(`Cleave API answered HTTP ${response.status} without a JSON object`, response.status, requestId);
	return body;
}
