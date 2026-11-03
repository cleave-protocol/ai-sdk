import { readFileSync } from "node:fs";
import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod/v4";
import * as core from "../src/core.js";
import type { FindTokenInput, GetGasInput, PlanSwapInput, TrackSwapInput } from "../src/core.js";
import * as root from "../src/index.js";
import type { findTokenInput, getGasInput, planSwapInput, trackSwapInput } from "../src/schemas.js";

function runtimeImports(file: URL, seen = new Set<string>()): string[] {
	if (seen.has(file.href)) return [];
	seen.add(file.href);
	const text = readFileSync(file, "utf8");
	const specs = [...text.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?\sfrom\s+"([^"]+)";/gms)].map((m) => m[1] as string);
	return specs.flatMap((spec) => (spec.startsWith(".") ? [spec, ...runtimeImports(new URL(spec.replace(/\.js$/, ".ts"), file), seen)] : [spec]));
}

describe("core entry", () => {
	it("imports neither ai nor zod at run time", () => {
		const specs = runtimeImports(new URL("../src/core.ts", import.meta.url));
		expect(specs).toContain("./checks.js");
		expect(specs).toContain("./allowlist.js");
		expect(specs.filter((s) => !s.startsWith("."))).toEqual(expect.arrayContaining(["@noble/hashes/sha3", "@noble/hashes/utils"]));
		expect(specs.filter((s) => !s.startsWith(".") && !s.startsWith("@noble/hashes/"))).toEqual([]);
	});

	it("the import scan sees a runtime zod import in the root graph", () => {
		const specs = runtimeImports(new URL("../src/index.ts", import.meta.url));
		expect(specs).toContain("ai");
		expect(specs).toContain("zod/v4");
	});

	it("the main entry reaches the shared code only through the core entry", () => {
		const direct = (name: string) => {
			const text = readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
			return [...text.matchAll(/^(?:import|export)\s+(?!type\b)[^;]*?\sfrom\s+"(\.[^"]+)";/gms)].map((m) => m[1] as string);
		};
		for (const name of ["index.ts", "tools.ts", "schemas.ts"]) expect(direct(name).filter((s) => !["./core.js", "./tools.js", "./schemas.js"].includes(s))).toEqual([]);
	});

	it("exports the client, checks and chain ids that the root entry exports", () => {
		expect(Object.keys(core).sort()).toEqual(["CHAIN_IDS", "CleaveApiError", "DEFAULT_BASE_URL", "DEFAULT_TIMEOUT_MS", "callTool", "checkGetGas", "checkPlanSwap", "screenGetGas", "screenPlanSwap"]);
		for (const name of ["CHAIN_IDS", "CleaveApiError", "DEFAULT_BASE_URL", "DEFAULT_TIMEOUT_MS", "checkGetGas", "checkPlanSwap", "screenGetGas", "screenPlanSwap"] as const) expect(core[name]).toBe(root[name]);
	});

	it("names CleaveApiError on the class and on what callTool throws", async () => {
		expect(new core.CleaveApiError("m", 0).name).toBe("CleaveApiError");
		const notJson = async () => new Response("not json", { status: 200 });
		const thrown = await core.callTool("find_token", { chainId: 8453, query: "USDC" }, { fetch: notJson }).catch((e: unknown) => e);
		expect(thrown).toBeInstanceOf(core.CleaveApiError);
		expect((thrown as Error).name).toBe("CleaveApiError");
	});

	it("types the inputs exactly as the schemas parse them", () => {
		expectTypeOf<z.infer<typeof planSwapInput>>().toEqualTypeOf<PlanSwapInput>();
		expectTypeOf<z.infer<typeof trackSwapInput>>().toEqualTypeOf<TrackSwapInput>();
		expectTypeOf<z.infer<typeof findTokenInput>>().toEqualTypeOf<FindTokenInput>();
		expectTypeOf<z.infer<typeof getGasInput>>().toEqualTypeOf<GetGasInput>();
		expectTypeOf<root.PlanSwapInput>().toEqualTypeOf<PlanSwapInput>();
		expectTypeOf<root.GetGasInput>().toEqualTypeOf<GetGasInput>();
	});
});
