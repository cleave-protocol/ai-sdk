import { tool } from "ai";
import type { Tool } from "ai";
import { screenGetGas, screenPlanSwap } from "./checks.js";
import { callTool } from "./client.js";
import type { CleaveResult, CleaveToolsOptions } from "./client.js";
import { findTokenInput, getGasInput, planSwapInput, trackSwapInput } from "./schemas.js";
import type { FindTokenInput, GetGasInput, PlanSwapInput, TrackSwapInput } from "./schemas.js";

export type CleaveTools = {
	planSwap: Tool<PlanSwapInput, CleaveResult>;
	trackSwap: Tool<TrackSwapInput, CleaveResult>;
	findToken: Tool<FindTokenInput, CleaveResult>;
	getGas: Tool<GetGasInput, CleaveResult>;
};

const DESCRIPTIONS = {
	planSwap:
		"Plans a token swap on one chain, a cross-chain swap or bridge, or a native-gas top-up on Ethereum, Arbitrum, Base, BNB Chain, Polygon or Optimism, and returns unsigned transactions for the given wallet to sign. It fits when the user wants to exchange tokens, move them between these chains, or get ETH, BNB or POL for gas. It sends nothing and moves no funds. The answer leads with blocking notices and warnings, then gives the route's outcome kind (an exact amount or one that can vary; with a swap on arrival, the token, else a named fallback; where a transfer can go unfilled, a refund of the bridged token on the source chain hours later), every third-party cost except network gas, the expected time, validUntil and the calls in signing order. A blocking notice returns no calls; a warning, or a recipient other than the wallet, sets requiresConfirmation. Calls sent after validUntil are stale: they can revert or, on some routes, end in a refund hours later. Amounts are decimal strings in token units; tokens are listed symbols or contract addresses; the recipient defaults to the wallet. The token to receive must be on Cleave's token list. For an ambiguous symbol, cleave_find_token lists the candidates; after sending, cleave_track_swap reports progress. A wallet with no gas can get it with cleave_get_gas.",
	trackSwap:
		"Reports the status of a swap, bridge or gas top-up that was planned with cleave_plan_swap and then sent, or ordered with cleave_get_gas: its state (for example pending, in flight, delivered, refund pending or refunded), what arrived against the plan and on which chain, and the next action or when to check again. It takes the chain and transaction hash, plus the plan's requestId when known, or for a gas top-up the requestId alone; a transaction to a contract outside Cleave's published list is reported as such. It fits when the user asks whether such a transfer arrived, and before any re-send, because re-sending a plan that is still in flight can pay twice. It reports states only and returns no transactions.",
	findToken:
		"Finds a token by symbol or contract address on Ethereum, Arbitrum, Base, BNB Chain, Polygon or Optimism and returns its address, decimals and whether it is on Cleave's token list, with a flag when it resembles a listed token. A symbol shared by several listed tokens returns every candidate by address instead of picking one. An unlisted token is found only by its address and comes back flagged, without a name or symbol. It fits before cleave_plan_swap when the user names a token by symbol and the address is unknown.",
	getGas:
		"Gets native gas (ETH, BNB or POL) on Ethereum, Arbitrum, Base, BNB Chain, Polygon or Optimism for a wallet that holds USDC on Ethereum, Arbitrum, Base, Optimism or Polygon but has no gas to send transactions. Called with the paying chain, the receiving chain, the recipient and a USDC amount, it returns an offer: the fee, the minimum native amount, the deadline, the order and one USDC authorization for the wallet to sign; signing costs no gas. Called again with the offer and the signature, it passes the signed order to Cleave's relayer, which executes it through a contract made for that one order, and returns a requestId for cleave_track_swap. On one chain the order swaps the USDC to the native coin for the recipient; from another chain it bridges the USDC and swaps it on arrival, delivering USDC instead if that swap fails. An order not executed by its deadline is refunded to the refund address, or, if paid from another chain and not filled, refunded hours later. When the wallet already holds some gas, cleave_plan_swap plans a swap to the native coin.",
} as const;

const NAMES = " In this package, cleave_plan_swap, cleave_track_swap, cleave_find_token and cleave_get_gas are the tools planSwap, trackSwap, findToken and getGas.";
const PLAN_SUFFIX = " Before any wallet signs, show the user the warnings, recipient, amounts and slippage, and get their confirmation. Do not raise slippage above the default 50 bps without the user's consent.";
const GAS_SUFFIX = " If a submission fails or times out, the order may still have been accepted: track g:<payChainId>:<orderHash> before signing a new offer.";

export function planSwap(options: CleaveToolsOptions = {}): Tool<PlanSwapInput, CleaveResult> {
	return tool({
		title: "Plan a swap, bridge or gas top-up",
		description: DESCRIPTIONS.planSwap + PLAN_SUFFIX + NAMES,
		inputSchema: planSwapInput,
		execute: async (input, { abortSignal }) => screenPlanSwap(input, await callTool("plan_swap", input, options, abortSignal)),
	});
}

export function trackSwap(options: CleaveToolsOptions = {}): Tool<TrackSwapInput, CleaveResult> {
	return tool({
		title: "Track a planned swap or transfer",
		description: DESCRIPTIONS.trackSwap + NAMES,
		inputSchema: trackSwapInput,
		execute: (input, { abortSignal }) => callTool("track_swap", input, options, abortSignal),
	});
}

export function findToken(options: CleaveToolsOptions = {}): Tool<FindTokenInput, CleaveResult> {
	return tool({
		title: "Find a token's contract address",
		description: DESCRIPTIONS.findToken + NAMES,
		inputSchema: findTokenInput,
		execute: (input, { abortSignal }) => callTool("find_token", input, options, abortSignal),
	});
}

export function getGas(options: CleaveToolsOptions = {}): Tool<GetGasInput, CleaveResult> {
	return tool({
		title: "Get native gas with USDC",
		description: DESCRIPTIONS.getGas + GAS_SUFFIX + NAMES,
		inputSchema: getGasInput,
		needsApproval: options.getGasApproval === false ? false : (input) => input.signature !== undefined,
		execute: async (input, { abortSignal }) => screenGetGas(input, await callTool("get_gas", input, options, abortSignal)),
	});
}

export function cleaveTools(options: CleaveToolsOptions = {}): CleaveTools {
	return { planSwap: planSwap(options), trackSwap: trackSwap(options), findToken: findToken(options), getGas: getGas(options) };
}
