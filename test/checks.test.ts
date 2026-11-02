import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import { ALLOWLIST } from "../src/allowlist.js";
import { screenGetGas, screenPlanSwap } from "../src/checks.js";
import { checkGetGas, checkPlanSwap, getGas, planSwap } from "../src/index.js";
import type { GetGasInput, PlanSwapInput } from "../src/index.js";

type Verdict = { result: "pass"; output?: Record<string, unknown> } | { result: "fail"; rule: string };

interface Vector {
	name: string;
	tool: "plan_swap" | "get_gas";
	request: Record<string, unknown>;
	response: Record<string, unknown>;
	expect: Verdict;
}

const file = JSON.parse(readFileSync(new URL("./fixtures/vectors.json", import.meta.url), "utf8")) as { allowlistVersion: string; vectors: Vector[] };
const vectors = file.vectors;

function verdict(v: Vector): Verdict {
	const out = v.tool === "plan_swap" ? screenPlanSwap(v.request as PlanSwapInput, v.response) : screenGetGas(v.request as GetGasInput, v.response);
	const error = out.error as { code?: unknown; message?: unknown } | undefined;
	if (error?.code === "address_not_allowed" && typeof error.message === "string") {
		expect(error.message).not.toContain("malformed");
		expect(Object.keys(out)).toEqual(["error"]);
		return { result: "fail", rule: error.message.slice(0, 2) };
	}
	return v.expect.result === "pass" && v.expect.output !== undefined ? { result: "pass", output: out } : { result: "pass" };
}

const keccak = (text: string | Uint8Array) => `0x${bytesToHex(keccak_256(text))}`;
const hex = (h: string) => Uint8Array.from(Buffer.from(h.replace(/^0x/, ""), "hex"));
const P = "(address,address,uint256,uint256,uint256,address,address,uint16,bool)";
const SIGNATURES: Record<string, string> = {
	swapWithBlob: `swapWithBlob(${P},bytes)`,
	swapMeasuredWithBlobV1: `swapMeasuredWithBlobV1(${P},(uint256,uint256),bytes)`,
	crossChainSwap: `crossChainSwap(${P},(uint256,uint256),bytes,bytes32,uint256,address,address,uint256,bytes,bytes)`,
	crossChainSwapNative: `crossChainSwapNative(${P},(uint256,uint256),bytes,bytes32,uint256,address,address,uint256,bytes,bytes)`,
	bridgeToken: "bridgeToken(address,uint256,bytes32,uint256,address,address,uint256,address,uint16,bytes,bytes)",
	deposit: "deposit()",
	withdraw: "withdraw(uint256)",
	depositNative: "depositNative(address,address,bytes32,address,uint256,bytes32,uint256,uint256,bytes32,uint32,uint32,uint32,bytes)",
};
const SPOKE_DEPOSIT = "deposit(bytes32,bytes32,bytes32,bytes32,uint256,uint256,uint256,bytes32,uint32,uint32,uint32,bytes)";

describe("shared vectors", () => {
	it("cover every rule, live probes and the pinned table version", () => {
		const rules = new Set(vectors.flatMap((v) => (v.expect.result === "fail" ? [v.expect.rule] : [])));
		expect([...rules].sort()).toEqual(["G1", "G2", "G3", "G4", "P1", "P2", "P3", "P4", "P5", "P6"]);
		expect(vectors.filter((v) => v.name.startsWith("live ")).length).toBeGreaterThanOrEqual(30);
		expect(file.allowlistVersion).toBe(ALLOWLIST.version);
	});

	it.each(vectors.map((v) => [v.name, v] as const))("%s", (_name, v) => {
		expect(verdict(v)).toEqual(v.expect);
	});
});

describe("pinned allowlist", () => {
	it("recomputes both clone init code hashes from the templates", () => {
		for (const kind of ["swap", "cross_chain"] as const) {
			const spec = ALLOWLIST.gas[kind];
			const code = `3d602d80600a3d3981f3363d3d373d3d3d363d73${spec.template.slice(2).toLowerCase()}5af43d82803e903d91602b57fd5bf3`;
			expect(keccak(hex(code))).toBe(spec.initCodeHash);
		}
	});

	it("names each selector after its function signature", () => {
		for (const chain of Object.values(ALLOWLIST.chains)) {
			for (const target of Object.values(chain.targets) as { role: string; selectors: Record<string, string> }[]) {
				for (const [selector, name] of Object.entries(target.selectors)) {
					const signature = target.role === "across_spoke_pool" ? SPOKE_DEPOSIT : SIGNATURES[name];
					expect(signature, name).toBeDefined();
					expect(keccak(signature as string).slice(0, 10)).toBe(selector);
				}
			}
		}
	});

	it("gives every lane its rails, with the chain id as the Across destination id", () => {
		for (const [from, chain] of Object.entries(ALLOWLIST.chains)) {
			const lanes = chain.lanes as Record<string, Record<string, number>>;
			expect(Object.keys(lanes).sort()).toEqual(Object.keys(ALLOWLIST.chains).filter((id) => id !== from).sort());
			for (const [to, rails] of Object.entries(lanes)) {
				for (const id of ["0xf6c86ecb0564cd8d732c9d68c369fbc03a0c351db7419e70be166d26a2ed4916", "0xa28bababc0e2b0c1c28d78d20a75d5ef0afd16dc155828d76a2bf6b97805d328"]) expect(rails[id], `${from}>${to}`).toBe(Number(to));
				if (chain.gasPay !== null) expect(rails[chain.gasPay.railId]).toBe(Number(to));
			}
		}
	});

	it("lists six targets on every chain and gas payment on five", () => {
		expect(Object.keys(ALLOWLIST.chains).sort()).toEqual(["1", "10", "137", "42161", "56", "8453"]);
		for (const chain of Object.values(ALLOWLIST.chains)) expect(Object.keys(chain.targets)).toHaveLength(6);
		expect(Object.entries(ALLOWLIST.chains).filter(([, c]) => c.gasPay !== null).map(([id]) => id).sort()).toEqual(["1", "10", "137", "42161", "8453"]);
	});
});

function byName(name: string): Vector {
	const v = vectors.find((x) => x.name === name);
	if (v === undefined) throw new Error(name);
	return v;
}

function answering(body: unknown) {
	return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
}

async function execute(t: unknown, input: unknown): Promise<unknown> {
	return (t as { execute: (input: unknown, options: unknown) => Promise<unknown> }).execute(input, { toolCallId: "call-1", messages: [], context: {} });
}

describe("tools", () => {
	it("planSwap returns a checked plan unchanged", async () => {
		const v = byName("live plan-8453-usdc-x42161-weth");
		expect(await execute(planSwap({ fetch: answering(v.response) }), v.request)).toEqual(v.response);
	});

	it("planSwap replaces a plan that fails a check with the refusal body only", async () => {
		const v = byName("attacker spender");
		const out = await execute(planSwap({ fetch: answering(v.response) }), v.request);
		expect(out).toEqual({ error: { code: "address_not_allowed", message: "P3: call 0 approves another spender", retryable: false } });
	});

	it("getGas replaces an offer that fails a check with the refusal body only", async () => {
		const v = byName("gas message.to swapped");
		const out = (await execute(getGas({ fetch: answering(v.response) }), v.request)) as Record<string, unknown>;
		expect(Object.keys(out)).toEqual(["error"]);
		expect(out.error).toEqual({ code: "address_not_allowed", message: "G4: the authorization pays another address", retryable: false });
	});

	it("getGas returns a checked offer unchanged", async () => {
		const v = byName("live gas-8453-x42161-recipient");
		expect(await execute(getGas({ fetch: answering(v.response) }), v.request)).toEqual(v.response);
	});

	it("checks a body whose error member is not a refusal object", async () => {
		const v = byName("error member null with an attacker target");
		const out = await execute(planSwap({ fetch: answering(v.response) }), v.request);
		expect(out).toEqual({ error: { code: "address_not_allowed", message: "P2: the main call's target is not on the allowlist", retryable: false } });
	});

	it("keeps only the error fields of an API refusal", async () => {
		const refusal = { apiVersion: "1", requestId: "r-9", error: { code: "invalid_param", message: "x", retryable: false }, calls: [{ to: "0x000000000000000000000000000000000000dEaD" }] };
		expect(await execute(planSwap({ fetch: answering(refusal) }), byName("live plan-8453-same").request)).toEqual({ apiVersion: "1", requestId: "r-9", error: { code: "invalid_param", message: "x", retryable: false } });
	});
});

describe("checks", () => {
	const plan = byName("live plan-8453-same");

	it("fails closed on a malformed body", () => {
		expect(checkPlanSwap(plan.request as PlanSwapInput, { calls: "nope" })).toMatchObject({ ok: false, rule: "P1" });
		expect(checkPlanSwap(plan.request as PlanSwapInput, { blocked: false, calls: [] })).toMatchObject({ ok: false, rule: "P1" });
		expect(checkGetGas(byName("live gas-1-same").request as GetGasInput, {})).toMatchObject({ ok: false, rule: "G1" });
		expect(checkGetGas({ ...(byName("live gas-1-same").request as GetGasInput), wallet: undefined }, {})).toMatchObject({ ok: false, rule: "G2" });
	});

	it("passes a blocked plan without calls", () => {
		expect(checkPlanSwap(plan.request as PlanSwapInput, { blocked: true, calls: [] })).toEqual({ ok: true });
	});

	it("compares addresses without regard to case", () => {
		const upper = (a: string) => `0x${a.slice(2).toUpperCase()}`;
		const body = structuredClone(plan.response) as { send: { token: string }; calls: { from: string; to: string; data: string }[] };
		body.send.token = upper(body.send.token);
		body.calls = body.calls.map((c) => ({ ...c, from: upper(c.from), to: upper(c.to), data: upper(c.data) }));
		const request = { ...plan.request, wallet: (plan.request.wallet as string).toLowerCase() } as PlanSwapInput;
		expect(checkPlanSwap(request, body)).toEqual({ ok: true });
	});

	it("names the failing rule in the message", () => {
		const r = checkPlanSwap({ ...(plan.request as PlanSwapInput), fromChainId: 1 }, plan.response);
		expect(r).toEqual({ ok: false, rule: "P1", message: "P1: call 0 is for another chain" });
	});
});
