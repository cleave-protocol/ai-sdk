import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { asSchema, generateText, isStepCount } from "ai";
import type { ModelMessage, ToolApprovalResponse } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { CleaveApiError, cleaveTools, findToken, getGas, planSwap, trackSwap } from "../src/index.js";
import type { CleaveToolsOptions } from "../src/index.js";

const WALLET = "0x00000000000000000000000000000000000A11cE";
const PROBES = (JSON.parse(readFileSync(new URL("./fixtures/vectors.json", import.meta.url), "utf8")) as { vectors: { name: string; request: Record<string, unknown>; response: Record<string, unknown> }[] }).vectors;
const probe = (name: string) => PROBES.find((v) => v.name === name) as { request: Record<string, unknown>; response: Record<string, unknown> };
const PLAN = probe("live plan-8453-usdc-wrapped-recipient");
const GAS = probe("live gas-8453-x56");
const HASH = `0x${"ab".repeat(32)}`;

type Factory = (options?: CleaveToolsOptions) => { inputSchema: unknown; execute?: (input: never, options: never) => unknown };

interface Case {
	name: string;
	factory: Factory;
	endpoint: string;
	valid: Record<string, unknown>;
	answer: Record<string, unknown>;
	invalid: [string, Record<string, unknown>][];
}

const CASES: Case[] = [
	{
		name: "planSwap",
		factory: planSwap as Factory,
		endpoint: "plan_swap",
		valid: PLAN.request,
		answer: PLAN.response,
		invalid: [
			["a missing wallet", { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: "25" }],
			["a bad address", { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: "25", wallet: "0x1234" }],
			["an unsupported chain", { fromChainId: 250, sellToken: "USDC", buyToken: "WETH", amount: "25", wallet: WALLET }],
			["a numeric amount", { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: 25, wallet: WALLET }],
			["slippage above 5000", { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: "25", wallet: WALLET, maxSlippageBps: 5001 }],
			["an unknown field", { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: "25", wallet: WALLET, privateKey: "0x01" }],
		],
	},
	{
		name: "trackSwap",
		factory: trackSwap as Factory,
		endpoint: "track_swap",
		valid: { chainId: 8453, txHash: HASH, requestId: "8b0f6d3e-1c2a-4f5b-9e7d-123456789abc" },
		answer: { apiVersion: "1", status: "pending", matchesPlan: null, next: "Check again shortly.", pollAfterSec: 15 },
		invalid: [
			["a short hash", { chainId: 8453, txHash: "0xabc" }],
			["a malformed requestId", { requestId: "not a request id!" }],
			["an unsupported chain", { chainId: 5, txHash: HASH }],
			["an unknown field", { chainId: 8453, txHash: HASH, extra: 1 }],
		],
	},
	{
		name: "findToken",
		factory: findToken as Factory,
		endpoint: "find_token",
		valid: { chainId: 42161, query: "USDC" },
		answer: { ambiguous: false, candidates: [{ address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6, listed: true, symbol: "USDC", name: "USD Coin", flags: [] }] },
		invalid: [
			["a missing query", { chainId: 42161 }],
			["an empty query", { chainId: 42161, query: "" }],
			["a query over 64 characters", { chainId: 42161, query: "x".repeat(65) }],
			["a string chain id", { chainId: "42161", query: "USDC" }],
		],
	},
	{
		name: "getGas",
		factory: getGas as Factory,
		endpoint: "get_gas",
		valid: GAS.request,
		answer: GAS.response,
		invalid: [
			["a non-hex signature", { offer: "opaque-offer", signature: "abc", wallet: WALLET }],
			["an oversized offer", { offer: "x".repeat(4097), signature: "0x01", wallet: WALLET }],
			["a bad recipient", { payChainId: 8453, chainId: 8453, recipient: "alice.eth", amount: "5" }],
			["a private key field", { payChainId: 8453, chainId: 8453, recipient: WALLET, amount: "5", privateKey: "0x01" }],
		],
	},
];

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function mockFetch(status: number, body: unknown) {
	return vi.fn<typeof fetch>(async () => (typeof body === "string" ? new Response(body, { status }) : jsonResponse(status, body)));
}

async function run(c: Case, options: CleaveToolsOptions, input: Record<string, unknown> = c.valid, abortSignal?: AbortSignal): Promise<unknown> {
	const t = c.factory(options) as unknown as { execute: (input: unknown, options: unknown) => Promise<unknown> };
	return t.execute(input, { toolCallId: "call-1", messages: [], context: {}, abortSignal });
}

function schemaOf(c: Case) {
	return c.factory().inputSchema as { safeParse: (v: unknown) => { success: boolean } };
}

describe.each(CASES)("$name", (c) => {
	it("posts the input to its Agent REST endpoint and returns the answer", async () => {
		const fetch = mockFetch(200, c.answer);
		const out = await run(c, { fetch });
		expect(out).toEqual(c.answer);
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`https://api.cleave.fi/agent/v1/${c.endpoint}`);
		expect(init.method).toBe("POST");
		expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
		expect((init.headers as Record<string, string>).authorization).toBeUndefined();
		expect(JSON.parse(init.body as string)).toEqual(c.valid);
	});

	it("returns an API refusal unchanged", async () => {
		const refusal = { apiVersion: "1", requestId: "req-9", error: { code: "rate_limited", reason: "agent_limit", message: "Busy", detail: "Busy", retryable: true, retryAfterSec: 3 } };
		const out = await run(c, { fetch: mockFetch(429, refusal) });
		expect(out).toEqual(refusal);
	});

	it("throws CleaveApiError when the answer is not JSON", async () => {
		const err = await run(c, { fetch: mockFetch(502, "<html>Bad gateway</html>") }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(CleaveApiError);
		expect((err as CleaveApiError).status).toBe(502);
	});

	it("accepts the valid input", () => {
		expect(schemaOf(c).safeParse(c.valid).success).toBe(true);
	});

	it.each(c.invalid)("rejects %s", (_label, input) => {
		expect(schemaOf(c).safeParse(input).success).toBe(false);
	});
});

describe("options", () => {
	const c = CASES[2] as Case;

	it("sends a partner key as a bearer token", async () => {
		const fetch = mockFetch(200, c.answer);
		await run(c, { fetch, apiKey: "cq_live_test" });
		const init = fetch.mock.calls[0]?.[1] as RequestInit;
		expect((init.headers as Record<string, string>).authorization).toBe("Bearer cq_live_test");
	});

	it("uses a custom base URL without a trailing slash", async () => {
		const fetch = mockFetch(200, c.answer);
		await run(c, { fetch, baseUrl: "https://staging.example/" });
		expect(fetch.mock.calls[0]?.[0]).toBe("https://staging.example/agent/v1/find_token");
	});

	it("sends the package user agent", async () => {
		const fetch = mockFetch(200, c.answer);
		await run(c, { fetch });
		const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
		expect(((fetch.mock.calls[0]?.[1] as RequestInit).headers as Record<string, string>)["user-agent"]).toBe(`cleave-ai-sdk/${version}`);
	});

	it("rejects a stalled fetch after timeoutMs", async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(() => new Promise<Response>(() => undefined));
		const started = Date.now();
		const err = await run(c, { fetch, timeoutMs: 50 }).catch((e: unknown) => e);
		expect(Date.now() - started).toBeLessThan(2_000);
		expect(err).toBeInstanceOf(CleaveApiError);
		expect((err as CleaveApiError).status).toBe(0);
		expect((err as CleaveApiError).message).toContain("50 ms");
		expect(((err as CleaveApiError).cause as Error).name).toBe("TimeoutError");
	});

	it("rejects with the caller's abort and passes a signal to fetch", async () => {
		const fetch = vi.fn<typeof globalThis.fetch>((_url, init) => new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))));
		const controller = new AbortController();
		const pending = run(c, { fetch }, c.valid, controller.signal).catch((e: unknown) => e);
		controller.abort(new Error("stop"));
		const err = await pending;
		expect((fetch.mock.calls[0]?.[1] as RequestInit).signal?.aborted).toBe(true);
		expect(err).toBeInstanceOf(CleaveApiError);
		expect((err as CleaveApiError).message).toContain("aborted");
		expect(((err as CleaveApiError).cause as Error).message).toBe("stop");
	});

	it("wraps a network error and keeps the cause", async () => {
		const cause = new TypeError("fetch failed");
		const err = await run(c, { fetch: vi.fn<typeof globalThis.fetch>(async () => { throw cause; }) }).catch((e: unknown) => e);
		expect(err).toBeInstanceOf(CleaveApiError);
		expect((err as CleaveApiError).status).toBe(0);
		expect((err as CleaveApiError).cause).toBe(cause);
	});

	it("carries x-request-id on an error without a JSON body", async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response("<html>Bad gateway</html>", { status: 502, headers: { "x-request-id": "req-502" } }));
		const err = await run(c, { fetch }).catch((e: unknown) => e);
		expect((err as CleaveApiError).requestId).toBe("req-502");
	});

	it("describes chain ids as integers", async () => {
		const schema = (await asSchema(findToken().inputSchema).jsonSchema) as { properties: { chainId: { type: string; enum: number[] } } };
		expect(schema.properties.chainId.type).toBe("integer");
		expect(schema.properties.chainId.enum).toEqual([1, 10, 56, 137, 8453, 42161]);
	});

	it("throws when an error status has no error body", async () => {
		await expect(run(c, { fetch: mockFetch(500, { ok: false }) })).rejects.toBeInstanceOf(CleaveApiError);
	});

	it("cleaveTools returns the four tools", () => {
		expect(Object.keys(cleaveTools()).sort()).toEqual(["findToken", "getGas", "planSwap", "trackSwap"]);
	});
});

const USAGE = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };

function scriptedModel(toolName: string, input: unknown) {
	let step = 0;
	return new MockLanguageModelV3({
		doGenerate: async () => {
			step += 1;
			if (step === 1) return { content: [{ type: "tool-call", toolCallId: "call-1", toolName, input: JSON.stringify(input) }], finishReason: { unified: "tool-calls", raw: "tool_calls" }, usage: USAGE, warnings: [] };
			return { content: [{ type: "text", text: "done" }], finishReason: { unified: "stop", raw: "stop" }, usage: USAGE, warnings: [] };
		},
	});
}

describe("with generateText", () => {
	it.each(CASES)("runs $name from a model tool call", async (c) => {
		const fetch = mockFetch(200, c.answer);
		const result = await generateText({ model: scriptedModel(c.name, c.valid), tools: cleaveTools({ fetch }), prompt: "go", stopWhen: isStepCount(3) });
		expect(fetch).toHaveBeenCalledTimes(1);
		const results = result.steps.flatMap((s) => s.toolResults);
		expect(results).toHaveLength(1);
		expect(results[0]?.toolName).toBe(c.name);
		expect(results[0]?.output).toEqual(c.answer);
	});

	it.each(CASES)("never calls the API for invalid $name input", async (c) => {
		const fetch = mockFetch(200, c.answer);
		const [, bad] = c.invalid[0] as [string, Record<string, unknown>];
		const result = await generateText({ model: scriptedModel(c.name, bad), tools: cleaveTools({ fetch }), prompt: "go", stopWhen: isStepCount(3) });
		expect(fetch).not.toHaveBeenCalled();
		const errors = result.steps.flatMap((s) => s.content.filter((p) => p.type === "tool-error"));
		expect(errors).toHaveLength(1);
	});
});

describe("getGas approval", () => {
	const order = { offer: "opaque-offer", signature: `0x${"11".repeat(65)}`, wallet: WALLET };
	const answer = { requestId: `g:8453:0x${"22".repeat(32)}` };

	it("asks for approval before passing a signed order", async () => {
		const fetch = mockFetch(200, answer);
		const result = await generateText({ model: scriptedModel("getGas", order), tools: cleaveTools({ fetch }), prompt: "go", stopWhen: isStepCount(3) });
		expect(fetch).not.toHaveBeenCalled();
		expect(result.steps.flatMap((s) => s.content.filter((p) => p.type === "tool-approval-request"))).toHaveLength(1);
	});

	it("needs no approval for an offer", async () => {
		const fetch = mockFetch(200, answer);
		await generateText({ model: scriptedModel("getGas", { payChainId: 8453, chainId: 8453, recipient: WALLET, amount: "5" }), tools: cleaveTools({ fetch }), prompt: "go", stopWhen: isStepCount(3) });
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it.each([true, false])("resumes after the user answers %s, as in the README", async (answer) => {
		const fetch = mockFetch(200, answer ? { requestId: "g:8453:0x" + "22".repeat(32) } : {});
		const model = scriptedModel("getGas", order);
		const tools = cleaveTools({ fetch });
		const messages: ModelMessage[] = [{ role: "user", content: "Submit the gas order my wallet just signed." }];
		const first = await generateText({ model, tools, messages, stopWhen: isStepCount(5) });
		messages.push(...first.response.messages);
		const approvals: ToolApprovalResponse[] = [];
		for (const part of first.content) {
			if (part.type === "tool-approval-request") approvals.push({ type: "tool-approval-response", approvalId: part.approvalId, approved: answer });
		}
		expect(approvals).toHaveLength(1);
		expect(fetch).not.toHaveBeenCalled();
		messages.push({ role: "tool", content: approvals });
		const second = await generateText({ model, tools, messages, stopWhen: isStepCount(5) });
		expect(fetch).toHaveBeenCalledTimes(answer ? 1 : 0);
		expect(second.text).toBe("done");
	});

	it("passes a signed order without approval when getGasApproval is false", async () => {
		const fetch = mockFetch(200, answer);
		await generateText({ model: scriptedModel("getGas", order), tools: cleaveTools({ fetch, getGasApproval: false }), prompt: "go", stopWhen: isStepCount(3) });
		expect(fetch).toHaveBeenCalledTimes(1);
	});
});
