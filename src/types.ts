import type { CHAIN_IDS } from "./chains.js";

export type ChainId = (typeof CHAIN_IDS)[number];

export type PlanSwapInput = {
	fromChainId: ChainId;
	toChainId?: ChainId | undefined;
	sellToken: string;
	buyToken: string;
	amount: string;
	wallet: string;
	recipient?: string | undefined;
	maxSlippageBps?: number | undefined;
};

export type TrackSwapInput = {
	chainId?: ChainId | undefined;
	txHash?: string | undefined;
	requestId?: string | undefined;
};

export type FindTokenInput = {
	chainId: ChainId;
	query: string;
};

export type GetGasInput = {
	payChainId?: ChainId | undefined;
	chainId?: ChainId | undefined;
	recipient?: string | undefined;
	amount?: string | undefined;
	wallet?: string | undefined;
	refundTo?: string | undefined;
	offer?: string | undefined;
	signature?: string | undefined;
};
