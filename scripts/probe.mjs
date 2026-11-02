import { cleaveTools } from "../dist/index.js";

const WALLET = "0x00000000000000000000000000000000000A11cE";
const tools = cleaveTools();

const checks = [
	{
		tool: "planSwap",
		input: { fromChainId: 8453, sellToken: "USDC", buyToken: "WETH", amount: "25", wallet: WALLET, recipient: WALLET },
		ok: (r) => typeof r.requestId === "string" && Array.isArray(r.calls) && r.error === undefined,
	},
	{
		tool: "trackSwap",
		input: { requestId: `g:8453:0x${"0".repeat(64)}` },
		ok: (r) => r.error?.code === "not_found",
	},
	{
		tool: "findToken",
		input: { chainId: 42161, query: "USDC" },
		ok: (r) => Array.isArray(r.candidates) && r.candidates.some((c) => c.address === "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
	},
	{
		tool: "getGas",
		input: { payChainId: 8453, chainId: 8453, recipient: WALLET, amount: "5", wallet: WALLET },
		ok: (r) => typeof r.offer === "string" && r.error === undefined,
	},
];

let failed = 0;
for (const { tool, input, ok } of checks) {
	const started = Date.now();
	let result;
	try {
		result = await tools[tool].execute(input, { toolCallId: `probe-${tool}`, messages: [], context: {} });
	} catch (err) {
		result = { thrown: String(err) };
	}
	const pass = ok(result);
	if (!pass) failed += 1;
	console.log(JSON.stringify({ tool, pass, ms: Date.now() - started, input, result }, null, 2));
}
console.log(`probe: ${checks.length - failed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
