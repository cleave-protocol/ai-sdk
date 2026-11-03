import { z } from "zod/v4";
import { CHAIN_IDS } from "./chains.js";

export { CHAIN_IDS };

const chain = (description: string) => z.literal(CHAIN_IDS).meta({ type: "integer" }).describe(description);
const address = (description: string) => z.string().regex(/^0x[0-9a-fA-F]{40}$/).describe(description);
const token = (description: string) => z.string().min(1).max(64).describe(description);
const amount = (description: string) => z.string().regex(/^[0-9]+(\.[0-9]+)?$/).describe(description);

export const planSwapInput = z.strictObject({
	fromChainId: chain("Chain id of the token to sell: 1 Ethereum, 10 Optimism, 56 BNB Chain, 137 Polygon, 8453 Base, 42161 Arbitrum"),
	toChainId: chain("Chain id of the token to receive; defaults to fromChainId").optional(),
	sellToken: token("The token to sell: a listed symbol or a contract address"),
	buyToken: token("The token to receive: a listed symbol or a contract address"),
	amount: amount("Decimal amount of sellToken in token units, such as \"25.5\""),
	wallet: address("The wallet that signs and pays"),
	recipient: address("Who receives; defaults to wallet").optional(),
	maxSlippageBps: z.number().int().min(0).max(5000).describe("Slippage limit in basis points, 0 to 5000").optional(),
});

export const trackSwapInput = z.strictObject({
	chainId: chain("Chain id of the sent transaction").optional(),
	txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).describe("Hash of the sent transaction").optional(),
	requestId: z
		.string()
		.min(1)
		.max(79)
		.regex(/^([A-Za-z0-9-]{1,64}|g:[0-9]{1,10}:0x[0-9a-fA-F]{64})$/)
		.describe("The plan's requestId, or for a gas order its requestId alone (g:<payChainId>:<orderHash>)")
		.optional(),
});

export const findTokenInput = z.strictObject({
	chainId: chain("Chain id to search on"),
	query: z.string().min(1).max(64).describe("A symbol or a contract address"),
});

export const getGasInput = z.strictObject({
	payChainId: chain("Chain id the USDC is paid on (first call)").optional(),
	chainId: chain("Chain id the native coin is delivered on (first call)").optional(),
	recipient: address("Who receives the native coin (first call)").optional(),
	amount: amount("USDC to pay, as a decimal string such as \"5\" (first call)").optional(),
	wallet: address("The paying wallet; with it, the offer carries the authorization to sign. Required on the second call").optional(),
	refundTo: address("Where a refund goes on the pay chain (first call)").optional(),
	offer: z.string().min(1).max(4096).describe("The offer string from the first call (second call)").optional(),
	signature: z.string().regex(/^0x[0-9a-fA-F]+$/).describe("The wallet's signature of the offer's typedData (second call)").optional(),
});

export type { FindTokenInput, GetGasInput, PlanSwapInput, TrackSwapInput } from "./types.js";
