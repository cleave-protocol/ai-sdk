import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { ALLOWLIST } from "./allowlist.js";
import type { GetGasInput, PlanSwapInput } from "./schemas.js";

export type CheckRule = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "G1" | "G2" | "G3" | "G4";
export type CheckResult = { ok: true } | { ok: false; rule: CheckRule; message: string };

type Body = Record<string, unknown>;

interface ChainEntry {
	usdc: string;
	usdcDecimals: number;
	wrappedNative: string;
	nativeSymbol: string;
	wrappedSymbol: string;
	composer: string;
	houseReferrer: string;
	stablecoins: readonly string[];
	gasDeliveryShell: string;
	gasPay: { routerV3: string; acrossUsdcAdapter: string; railId: string } | null;
	targets: Record<string, { role: string; selectors: Record<string, string> }>;
	lanes: Record<string, Record<string, number>>;
}

interface Chain {
	usdc: string;
	usdcDecimals: number;
	wrappedNative: string;
	symbols: Map<string, string>;
	composer: string;
	houseReferrer: string;
	stablecoins: Set<string>;
	deliveryShell: string;
	gasPay: { routerV3: string; acrossUsdcAdapter: string; railId: string } | null;
	targets: Map<string, { role: string; selectors: Set<string> }>;
	spokePool: string | null;
	lanes: Map<number, Map<string, bigint>>;
}

interface Call {
	to: string;
	data: string;
	value: bigint;
}

const low = (a: string): string => a.toLowerCase();
const NATIVE = low(ALLOWLIST.nativeSentinel);
const HANDLER = low(ALLOWLIST.acrossHandler);
const FACTORY = low(ALLOWLIST.gas.factory);
const FEE_RECIPIENT = low(ALLOWLIST.gas.feeRecipient);
const ZERO_ADDRESS = `0x${"0".repeat(40)}`;

const CHAINS = new Map<number, Chain>(
	Object.entries(ALLOWLIST.chains as Record<string, ChainEntry>).map(([id, c]) => [
		Number(id),
		{
			usdc: low(c.usdc),
			usdcDecimals: c.usdcDecimals,
			wrappedNative: low(c.wrappedNative),
			symbols: new Map([
				["usdc", low(c.usdc)],
				[low(c.nativeSymbol), NATIVE],
				[low(c.wrappedSymbol), low(c.wrappedNative)],
			]),
			composer: low(c.composer),
			houseReferrer: low(c.houseReferrer),
			stablecoins: new Set(c.stablecoins.map(low)),
			deliveryShell: low(c.gasDeliveryShell),
			gasPay: c.gasPay === null ? null : { routerV3: low(c.gasPay.routerV3), acrossUsdcAdapter: low(c.gasPay.acrossUsdcAdapter), railId: low(c.gasPay.railId) },
			targets: new Map(Object.entries(c.targets).map(([a, t]) => [low(a), { role: t.role, selectors: new Set(Object.keys(t.selectors)) }])),
			spokePool: Object.entries(c.targets).find(([, t]) => t.role === "across_spoke_pool")?.[0].toLowerCase() ?? null,
			lanes: new Map(Object.entries(c.lanes).map(([to, rails]) => [Number(to), new Map(Object.entries(rails).map(([r, d]) => [low(r), BigInt(d)]))])),
		},
	]),
);

const MAX_UINT = (1n << 256n) - 1n;
const HALF_UINT = 1n << 255n;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_DATA = /^0x(?:[0-9a-fA-F]{2})*$/;
const HEX_QUANTITY = /^0x[0-9a-fA-F]{1,64}$/;
const BYTES32 = /^0x[0-9a-fA-F]{64}$/;
const DECIMAL_INT = /^[0-9]{1,78}$/;
const DECIMAL = /^([0-9]{1,30})(?:\.([0-9]{1,30}))?$/;

const APPROVE = "0x095ea7b3";
const SWAP = "0xab33b1ec";
const MEASURED = "0xe0b7822f";
const CROSS = "0x84022178";
const CROSS_NATIVE = "0xf79eec2e";
const BRIDGE = "0x9edd28ad";
const DEPOSIT = "0xd0e30db0";
const WITHDRAW = "0x2e1a7d4d";
const SPOKE_DEPOSIT = "0xad5425c6";
const DEPOSIT_NATIVE = "0x609ea081";

const SAME_CHAIN = new Set([SWAP, MEASURED, DEPOSIT, WITHDRAW]);
const PULLS: Readonly<Record<string, { token: number; pulled: readonly number[] }>> = {
	[SWAP]: { token: 0, pulled: [2] },
	[MEASURED]: { token: 0, pulled: [9] },
	[CROSS]: { token: 0, pulled: [2, 9] },
	[BRIDGE]: { token: 0, pulled: [1] },
	[SPOKE_DEPOSIT]: { token: 2, pulled: [4] },
};
const AMOUNT_IN: Readonly<Record<string, number>> = { [SWAP]: 2, [MEASURED]: 2, [CROSS]: 2, [CROSS_NATIVE]: 2, [BRIDGE]: 1, [SPOKE_DEPOSIT]: 4, [DEPOSIT_NATIVE]: 4, [WITHDRAW]: 0 };
const REFERRAL: Readonly<Record<string, readonly [number, number]>> = { [SWAP]: [6, 7], [MEASURED]: [6, 7], [CROSS]: [6, 7], [CROSS_NATIVE]: [6, 7], [BRIDGE]: [7, 8] };
const MIN_OUT: Readonly<Record<string, readonly number[]>> = { [SWAP]: [3], [MEASURED]: [3, 10], [CROSS]: [3, 16], [CROSS_NATIVE]: [3, 16], [BRIDGE]: [6], [SPOKE_DEPOSIT]: [5], [DEPOSIT_NATIVE]: [6] };

type FieldType = "uint" | "uint8" | "address" | "bytes32";

const SWAP_ORDER: readonly [string, FieldType][] = [
	["chainId", "uint"],
	["token", "address"],
	["shell", "address"],
	["amount", "uint"],
	["fee", "uint"],
	["feeRecipient", "address"],
	["maxProtocolFeeBps", "uint"],
	["refundTo", "address"],
	["recipient", "address"],
	["minOut", "uint"],
	["deadline", "uint"],
	["quoteId", "bytes32"],
];

const ACROSS_ORDER: readonly [string, FieldType][] = [
	["chainId", "uint"],
	["token", "address"],
	["router", "address"],
	["railId", "bytes32"],
	["adapter", "address"],
	["dstChainId", "uint"],
	["dstToken", "address"],
	["dstDecimals", "uint8"],
	["handler", "address"],
	["dstShell", "address"],
	["dstWrappedNative", "address"],
	["amount", "uint"],
	["fee", "uint"],
	["feeRecipient", "address"],
	["maxProtocolFeeBps", "uint"],
	["relayFee", "uint"],
	["refundTo", "address"],
	["recipient", "address"],
	["outputAmount", "uint"],
	["minOut", "uint"],
	["messageHash", "bytes32"],
	["deadline", "uint"],
	["quoteId", "bytes32"],
];

const AUTH_FIELDS: readonly [string, string][] = [
	["from", "address"],
	["to", "address"],
	["value", "uint256"],
	["validAfter", "uint256"],
	["validBefore", "uint256"],
	["nonce", "bytes32"],
];

class Refusal {
	constructor(
		readonly rule: CheckRule,
		readonly message: string,
	) {}
}

function fail(rule: CheckRule, message: string): never {
	throw new Refusal(rule, message);
}

function guard(run: (at: (rule: CheckRule) => void) => void): CheckResult {
	let current: CheckRule = "P1";
	try {
		run((rule) => {
			current = rule;
		});
		return { ok: true };
	} catch (err) {
		const r = err instanceof Refusal ? err : new Refusal(current, "the answer is malformed");
		return { ok: false, rule: r.rule, message: `${r.rule}: ${r.message}` };
	}
}

const isObject = (v: unknown): v is Body => typeof v === "object" && v !== null && !Array.isArray(v);

function object(v: unknown, rule: CheckRule, what: string): Body {
	return isObject(v) ? v : fail(rule, `${what} is missing`);
}

function address(v: unknown, rule: CheckRule, what: string): string {
	return typeof v === "string" && ADDRESS.test(v) ? low(v) : fail(rule, `${what} is not an address`);
}

function integer(v: unknown, rule: CheckRule, what: string): bigint {
	if (typeof v === "number" && Number.isSafeInteger(v) && v >= 0) return BigInt(v);
	if (typeof v === "string" && DECIMAL_INT.test(v)) {
		const n = BigInt(v);
		if (n <= MAX_UINT) return n;
	}
	return fail(rule, `${what} is not an unsigned integer`);
}

function quantity(v: unknown, rule: CheckRule, what: string): bigint {
	return typeof v === "string" && HEX_QUANTITY.test(v) ? BigInt(v) : fail(rule, `${what} is not a hex quantity`);
}

function bytes32(v: unknown, rule: CheckRule, what: string): string {
	return typeof v === "string" && BYTES32.test(v) ? low(v) : fail(rule, `${what} is not 32 bytes`);
}

function units(v: unknown, decimals: number, rule: CheckRule, what: string): bigint {
	const m = typeof v === "string" ? DECIMAL.exec(v) : null;
	const frac = m?.[2] ?? "";
	if (m === null || frac.length > decimals) return fail(rule, `${what} is not a decimal amount`);
	return BigInt(m[1] as string) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, "0") || "0");
}

function normalDecimal(v: unknown, rule: CheckRule, what: string): string {
	const m = typeof v === "string" ? DECIMAL.exec(v) : null;
	if (m === null) return fail(rule, `${what} is not a decimal amount`);
	const frac = (m[2] ?? "").replace(/0+$/, "");
	return `${BigInt(m[1] as string)}${frac === "" ? "" : `.${frac}`}`;
}

function word(data: string, k: number, rule: CheckRule, what: string): string {
	const w = data.slice(10 + 64 * k, 74 + 64 * k);
	return w.length === 64 ? w : fail(rule, `${what} is missing from the calldata`);
}

function wordInt(data: string, k: number, rule: CheckRule, what: string): bigint {
	return BigInt(`0x${word(data, k, rule, what)}`);
}

function wordAddress(data: string, k: number, rule: CheckRule, what: string): string {
	const w = word(data, k, rule, what);
	return w.startsWith("0".repeat(24)) ? `0x${w.slice(24)}` : fail(rule, `${what} is not an address`);
}

function sameChain(v: unknown, chainId: number): boolean {
	return (typeof v === "number" && v === chainId) || (typeof v === "string" && DECIMAL_INT.test(v) && BigInt(v) === BigInt(chainId));
}

const keccakHex = (hex: string): string => `0x${bytesToHex(keccak_256(hexToBytes(hex.slice(2))))}`;

export function checkPlanSwap(request: PlanSwapInput, body: Record<string, unknown>): CheckResult {
	return guard((at) => {
		at("P1");
		const fromChainId = request.fromChainId;
		const toChainId = request.toChainId ?? fromChainId;
		const wallet = address(request.wallet, "P1", "wallet");
		const calls = Array.isArray(body.calls) ? (body.calls as unknown[]) : fail("P1", "calls are missing");
		if (body.blocked === true) {
			if (calls.length > 0) fail("P1", "a blocked plan carries calls");
			return;
		}
		if (calls.length === 0) fail("P1", "the plan has no calls");
		const parsed: Call[] = calls.map((raw, i) => {
			const c = object(raw, "P1", `call ${i}`);
			if (!sameChain(c.chainId, fromChainId)) fail("P1", `call ${i} is for another chain`);
			if (address(c.from, "P1", `call ${i} from`) !== wallet) fail("P1", `call ${i} is from another wallet`);
			const to = address(c.to, "P1", `call ${i} to`);
			const data = typeof c.data === "string" && HEX_DATA.test(c.data) && c.data.length >= 10 ? low(c.data) : fail("P1", `call ${i} data is malformed`);
			return { to, data, value: quantity(c.value, "P1", `call ${i} value`) };
		});
		const main = parsed[parsed.length - 1] as Call;
		const selector = main.data.slice(0, 10);

		at("P2");
		const chain = CHAINS.get(fromChainId) ?? fail("P2", "the chain is not on the allowlist");
		const target = chain.targets.get(main.to) ?? fail("P2", "the main call's target is not on the allowlist");
		if (!target.selectors.has(selector)) fail("P2", "the main call's function is not allowed on its target");
		if (SAME_CHAIN.has(selector) !== (toChainId === fromChainId)) fail("P2", "the main call does not fit the route");

		at("P3");
		const send = object(body.send, "P3", "send");
		if (!sameChain(send.chainId, fromChainId)) fail("P3", "send is on another chain");
		const token = address(send.token, "P3", "send.token");
		const sellToken = request.sellToken;
		const pinned = ADDRESS.test(sellToken) ? low(sellToken) : (chain.symbols.get(low(sellToken.trim())) ?? null);
		if (pinned !== null && pinned !== token) fail("P3", "send.token is not the sell token");
		if (normalDecimal(send.amount, "P3", "send.amount") !== normalDecimal(request.amount, "P3", "amount")) fail("P3", "send.amount is not the requested amount");
		const native = token === NATIVE;
		const approves = parsed.slice(0, -1);
		if (approves.length > 2) fail("P3", "more than two calls come before the main call");
		const approved = approves.map((a, i) => {
			if (!a.data.startsWith(APPROVE) || a.data.length !== 138 || a.value !== 0n) fail("P3", `call ${i} is not a plain approve`);
			if (native || a.to !== token) fail("P3", `call ${i} approves another token`);
			if (wordAddress(a.data, 0, "P3", "spender") !== main.to) fail("P3", `call ${i} approves another spender`);
			const amount = wordInt(a.data, 1, "P3", "approve amount");
			if (amount >= HALF_UINT) fail("P3", `call ${i} is an unlimited approve`);
			return amount;
		});
		const last = approved[approved.length - 1];
		if (last === 0n) fail("P3", "the last approve is zero");
		if (approved.length === 2 && approved[0] !== 0n) fail("P3", "only approve(0) may come before the approve");

		at("P4");
		const pulls = PULLS[selector];
		if (pulls === undefined) {
			if (approves.length > 0) fail("P4", "this function takes no approve");
			if (selector === WITHDRAW ? main.to !== token : !native) fail("P4", "the main call spends another token");
		} else if (!native) {
			if (wordAddress(main.data, pulls.token, "P4", "token") !== token) fail("P4", "the main call spends another token");
			if (last !== undefined) {
				const pulled = pulls.pulled.map((k) => wordInt(main.data, k, "P4", "amount")).reduce((a, b) => (a > b ? a : b));
				if (pulled !== last) fail("P4", "the main call pulls another amount than approved");
				if (pulled > 2n * wordInt(main.data, AMOUNT_IN[selector] as number, "P4", "amountIn")) fail("P4", "the main call pulls more than twice its input");
			}
		}
		const decimals = native || token === chain.wrappedNative ? 18 : token === chain.usdc ? chain.usdcDecimals : null;
		const inWord = AMOUNT_IN[selector];
		if (decimals !== null && inWord !== undefined && wordInt(main.data, inWord, "P4", "amountIn") !== units(request.amount, decimals, "P4", "amount")) fail("P4", "the main call sells another amount than requested");
		for (const k of MIN_OUT[selector] ?? []) if (wordInt(main.data, k, "P4", "minimum") === 0n) fail("P4", "the main call has no minimum");

		at("P5");
		const fees = body.fees === undefined ? [] : Array.isArray(body.fees) ? (body.fees as unknown[]) : fail("P5", "fees are malformed");
		let value = native ? units(send.amount, 18, "P5", "send.amount") : 0n;
		for (const f of fees) {
			const fee = object(f, "P5", "fee");
			if (fee.kind !== "native_messaging") continue;
			if (target.role !== "router_v3") fail("P5", "only the router takes a native messaging fee");
			value += units(fee.amount, 18, "P5", "fee amount");
		}
		if (main.value !== value) fail("P5", "the main call sends another native value");
		const referral = REFERRAL[selector];
		if (referral !== undefined) {
			const referrer = wordAddress(main.data, referral[0], "P5", "referrer");
			const bps = wordInt(main.data, referral[1], "P5", "referral fee");
			const free: [string, bigint] = [ZERO_ADDRESS, BigInt(SAME_CHAIN.has(selector) ? ALLOWLIST.referral.sameChainBps : ALLOWLIST.referral.stablecoinBps)];
			const house: [string, bigint] = [chain.houseReferrer, BigInt(ALLOWLIST.referral.crossChainBps)];
			const dst = CHAINS.get(toChainId);
			const receive = isObject(body.receive) ? body.receive : null;
			const buyToken = request.buyToken;
			const tokenOut = typeof receive?.token === "string" && ADDRESS.test(receive.token) ? low(receive.token) : ADDRESS.test(buyToken) ? low(buyToken) : (dst?.symbols.get(low(buyToken.trim())) ?? null);
			const stableIn = chain.stablecoins.has(token);
			const allowed = SAME_CHAIN.has(selector) ? [free] : !stableIn ? [house] : tokenOut === null ? [free, house] : [dst?.stablecoins.has(tokenOut) === true ? free : house];
			if (!allowed.some(([a, b]) => a === referrer && b === bps)) fail("P5", "the referral fee goes to another address or has another size");
		}

		at("P6");
		const recipient = request.recipient === undefined ? wallet : address(request.recipient, "P6", "recipient");
		const composer = toChainId === fromChainId ? null : (CHAINS.get(toChainId)?.composer ?? null);
		const arrives = (a: string) => a === recipient || a === HANDLER || a === composer;
		const at6 = (k: number, what: string) => wordAddress(main.data, k, "P6", what);
		const lane = (railWord: number, dstWord: number) => {
			const dstId = chain.lanes.get(toChainId)?.get(`0x${word(main.data, railWord, "P6", "railId")}`);
			if (dstId === undefined || wordInt(main.data, dstWord, "P6", "destination") !== dstId) fail("P6", "the transfer goes to another chain");
		};
		const destination = (k: number) => {
			if (wordInt(main.data, k, "P6", "destination") !== BigInt(toChainId)) fail("P6", "the transfer goes to another chain");
		};
		switch (selector) {
			case SWAP:
			case MEASURED:
				if (at6(5, "recipient") !== recipient) fail("P6", "the swap pays another recipient");
				break;
			case CROSS:
			case CROSS_NATIVE:
				if (at6(5, "source recipient") !== main.to) fail("P6", "the source swap pays out of the router");
				if (!arrives(at6(14, "recipient"))) fail("P6", "the transfer pays another recipient");
				if (at6(15, "refund recipient") !== wallet) fail("P6", "refunds go to another address");
				lane(12, 13);
				break;
			case BRIDGE:
				if (!arrives(at6(4, "recipient"))) fail("P6", "the transfer pays another recipient");
				if (at6(5, "refund recipient") !== wallet) fail("P6", "refunds go to another address");
				lane(2, 3);
				break;
			case SPOKE_DEPOSIT:
				if (at6(0, "depositor") !== wallet) fail("P6", "refunds go to another address");
				if (![recipient, HANDLER].includes(at6(1, "recipient"))) fail("P6", "the transfer pays another recipient");
				destination(6);
				break;
			case DEPOSIT_NATIVE:
				if (at6(0, "spoke pool") !== chain.spokePool) fail("P6", "the deposit goes to another pool");
				if (at6(1, "depositor") !== wallet) fail("P6", "refunds go to another address");
				if (![recipient, HANDLER].includes(at6(2, "recipient"))) fail("P6", "the transfer pays another recipient");
				destination(7);
				break;
			case DEPOSIT:
			case WITHDRAW:
				if (recipient !== wallet) fail("P6", "wrapping pays the wallet, not the recipient");
				break;
			default:
				fail("P6", "the main call has no recipient rule");
		}
	});
}

function encodeOrder(order: Body, fields: readonly [string, FieldType][]): string {
	const keys = Object.keys(order);
	if (keys.length !== fields.length || !fields.every(([name]) => keys.includes(name))) fail("G4", "the order has other fields");
	return fields
		.map(([name, type]) => {
			const v = order[name];
			if (type === "address") return address(v, "G4", `order.${name}`).slice(2).padStart(64, "0");
			if (type === "bytes32") return bytes32(v, "G4", `order.${name}`).slice(2);
			const n = integer(v, "G4", `order.${name}`);
			if (type === "uint8" && n > 255n) fail("G4", `order.${name} is out of range`);
			return n.toString(16).padStart(64, "0");
		})
		.join("");
}

const toDst = (amount: bigint, from: number, to: number): bigint => (to >= from ? amount * 10n ** BigInt(to - from) : amount / 10n ** BigInt(from - to));

export function checkGetGas(request: GetGasInput, body: Record<string, unknown>): CheckResult {
	return guard((at) => {
		if (request.offer !== undefined) return;

		at("G1");
		const payChainId = request.payChainId ?? fail("G1", "the request has no pay chain");
		const chainId = request.chainId ?? fail("G1", "the request has no delivery chain");
		const pay = CHAINS.get(payChainId);
		const gasPay = pay?.gasPay ?? fail("G1", "the pay chain is not on the allowlist");
		const usdc = (pay as Chain).usdc;
		const payDecimals = (pay as Chain).usdcDecimals;
		const wallet = request.wallet === undefined ? null : address(request.wallet, "G1", "wallet");
		if (wallet !== null && body.typedData === undefined) fail("G1", "the offer has no authorization to sign");
		const typed = body.typedData === undefined ? null : object(body.typedData, "G1", "typedData");
		const message = typed === null ? null : object(typed.message, "G1", "typedData.message");
		if (typed !== null && message !== null) {
			if (typed.primaryType !== "ReceiveWithAuthorization") fail("G1", "the authorization is not ReceiveWithAuthorization");
			const types = object(typed.types, "G1", "typedData.types");
			const fields = Array.isArray(types.ReceiveWithAuthorization) ? (types.ReceiveWithAuthorization as unknown[]) : fail("G1", "the authorization type is missing");
			if (fields.length !== AUTH_FIELDS.length || !fields.every((f, i) => isObject(f) && f.name === AUTH_FIELDS[i]?.[0] && f.type === AUTH_FIELDS[i]?.[1])) fail("G1", "the authorization type has other fields");
			const domain = object(typed.domain, "G1", "typedData.domain");
			if (Object.keys(domain).length !== 4 || domain.name !== "USD Coin" || domain.version !== "2") fail("G1", "the domain is not USD Coin version 2");
			if (!sameChain(domain.chainId, payChainId)) fail("G1", "the domain is on another chain");
			if (address(domain.verifyingContract, "G1", "verifyingContract") !== usdc) fail("G1", "the authorization is for another token");
			if (wallet === null || address(message.from, "G1", "message.from") !== wallet) fail("G1", "the authorization is from another wallet");
			if (integer(message.validAfter, "G1", "validAfter") !== 0n) fail("G1", "validAfter is not 0");
		}

		at("G2");
		const order = object(body.order, "G2", "order");
		const amount = units(request.amount, payDecimals, "G2", "amount");
		if (integer(order.amount, "G2", "order.amount") !== amount) fail("G2", "the order amount is not the requested amount");
		if (message !== null && integer(message.value, "G2", "message.value") !== amount) fail("G2", "the authorization moves another amount");
		if (message !== null && integer(message.validBefore, "G2", "validBefore") > integer(order.deadline, "G2", "order.deadline")) fail("G2", "the authorization outlives the order");
		if (integer(order.chainId, "G2", "order.chainId") !== BigInt(payChainId)) fail("G2", "the order is on another chain");
		if (address(order.token, "G2", "order.token") !== usdc) fail("G2", "the order takes another token");
		const recipient = address(request.recipient, "G2", "recipient");
		if (address(order.recipient, "G2", "order.recipient") !== recipient) fail("G2", "the order pays another recipient");
		const swap = payChainId === chainId;
		const refundTo = request.refundTo !== undefined ? address(request.refundTo, "G2", "refundTo") : (wallet ?? (swap ? recipient : fail("G2", "the order has no refund address")));
		if (address(order.refundTo, "G2", "order.refundTo") !== refundTo) fail("G2", "the order refunds another address");
		const fee = integer(order.fee, "G2", "order.fee");
		if (fee >= amount) fail("G2", "the fee takes the whole amount");
		if (fee !== units(object(body.fee, "G2", "fee").usdc, payDecimals, "G2", "fee.usdc")) fail("G2", "the order fee is not the fee shown");
		const minOut = integer(order.minOut, "G2", "order.minOut");
		if (minOut === 0n || minOut !== integer(object(body.receive, "G2", "receive").minimumWei, "G2", "receive.minimumWei")) fail("G2", "the order minimum is not the minimum shown");
		const dst = CHAINS.get(chainId) ?? fail("G2", "the delivery chain is not on the allowlist");
		if (!swap) {
			const relayFee = integer(order.relayFee, "G2", "order.relayFee");
			if (relayFee * 2n > amount - fee) fail("G2", "the relay fee is above half the amount");
			if (integer(order.outputAmount, "G2", "order.outputAmount") !== toDst(amount - fee - relayFee, payDecimals, dst.usdcDecimals)) fail("G2", "the bridged amount is not the amount after fees");
		}

		at("G3");
		if (body.kind !== (swap ? "swap" : "cross_chain")) fail("G3", "the order is of another kind");
		if (body.payChainId !== payChainId || body.chainId !== chainId) fail("G3", "the offer is for other chains");
		const spec = swap ? ALLOWLIST.gas.swap : ALLOWLIST.gas.cross_chain;
		if (address(body.factory, "G3", "factory") !== FACTORY) fail("G3", "the factory is not the pinned one");
		if (address(body.template, "G3", "template") !== low(spec.template)) fail("G3", "the template is not the pinned one");
		const pinned = (name: string, want: string) => {
			if (address(order[name], "G3", `order.${name}`) !== want) fail("G3", `order.${name} is not the pinned one`);
		};
		pinned("feeRecipient", FEE_RECIPIENT);
		if (integer(order.maxProtocolFeeBps, "G3", "order.maxProtocolFeeBps") !== 0n) fail("G3", "the order allows a protocol fee");
		if (swap) pinned("shell", dst.deliveryShell);
		else {
			pinned("router", gasPay.routerV3);
			pinned("adapter", gasPay.acrossUsdcAdapter);
			pinned("handler", HANDLER);
			pinned("dstToken", dst.usdc);
			pinned("dstShell", dst.deliveryShell);
			pinned("dstWrappedNative", dst.wrappedNative);
			const railId = bytes32(order.railId, "G3", "order.railId");
			if (railId !== gasPay.railId || (pay as Chain).lanes.get(chainId)?.has(railId) !== true) fail("G3", "order.railId is not the pinned one");
			if (integer(order.dstChainId, "G3", "order.dstChainId") !== BigInt(chainId)) fail("G3", "the order delivers on another chain");
			if (integer(order.dstDecimals, "G3", "order.dstDecimals") !== BigInt(dst.usdcDecimals)) fail("G3", "order.dstDecimals is not the pinned one");
		}

		at("G4");
		const orderHash = keccakHex(`${low(spec.versionTag)}${encodeOrder(order, swap ? SWAP_ORDER : ACROSS_ORDER)}`);
		if (bytes32(body.orderHash, "G4", "orderHash") !== orderHash) fail("G4", "orderHash does not match the order");
		const payTo = `0x${keccakHex(`0xff${FACTORY.slice(2)}${orderHash.slice(2)}${low(spec.initCodeHash).slice(2)}`).slice(26)}`;
		if (address(body.payTo, "G4", "payTo") !== payTo) fail("G4", "payTo does not match the order");
		if (message !== null) {
			if (bytes32(message.nonce, "G4", "message.nonce") !== orderHash) fail("G4", "the authorization nonce is not the order hash");
			if (address(message.to, "G4", "message.to") !== payTo) fail("G4", "the authorization pays another address");
		}
	});
}

const PLAN_KEYS = ["requestId", "blocked", "requiresConfirmation", "route", "send", "pullsAtMost", "receive", "fees", "notices", "quotedAt", "validUntil", "calls", "next"];
const CALL_KEYS = ["chainId", "from", "to", "data", "value"];
const OFFER_KEYS = ["offer", "kind", "payChainId", "chainId", "payTo", "factory", "template", "order", "blob", "hubs", "message", "orderHash", "outcome", "pay", "fee", "receive", "deadline", "refundTo", "typedData", "etaSec", "verify"];
const SUBMIT_KEYS = ["requestId", "state", "payTo", "deadline"];
const ERROR_KEYS = ["code", "reason", "message", "detail", "retryable", "retryAfterSec", "suggestion", "notices"];
const DOMAIN_KEYS = ["name", "version", "chainId", "verifyingContract"];
const MESSAGE_KEYS = AUTH_FIELDS.map(([name]) => name);

function pick(source: Body, keys: readonly string[]): Body {
	const out: Body = {};
	for (const k of keys) if (k in source) out[k] = source[k];
	return out;
}

function apiRefusal(body: Body): Body | null {
	if (!isObject(body.error)) return null;
	return { ...pick(body, ["apiVersion", "requestId"]), error: pick(body.error, ERROR_KEYS) };
}

export function addressRefusal(message: string): Record<string, unknown> {
	return { error: { code: "address_not_allowed", message, retryable: false } };
}

export function screenPlanSwap(request: PlanSwapInput, body: Record<string, unknown>): Record<string, unknown> {
	const refusal = apiRefusal(body);
	if (refusal !== null) return refusal;
	const result = checkPlanSwap(request, body);
	if (!result.ok) return addressRefusal(result.message);
	const out = pick(body, PLAN_KEYS);
	out.calls = (body.calls as Body[]).map((c) => pick(c, CALL_KEYS));
	return out;
}

export function screenGetGas(request: GetGasInput, body: Record<string, unknown>): Record<string, unknown> {
	const refusal = apiRefusal(body);
	if (refusal !== null) return refusal;
	const result = checkGetGas(request, body);
	if (!result.ok) return addressRefusal(result.message);
	if (request.offer !== undefined) return pick(body, SUBMIT_KEYS);
	const out = pick(body, OFFER_KEYS);
	if (isObject(body.typedData)) {
		const t = body.typedData;
		out.typedData = {
			domain: pick(t.domain as Body, DOMAIN_KEYS),
			types: { ReceiveWithAuthorization: (t.types as { ReceiveWithAuthorization: Body[] }).ReceiveWithAuthorization.map((f) => pick(f, ["name", "type"])) },
			primaryType: t.primaryType,
			message: pick(t.message as Body, MESSAGE_KEYS),
		};
	}
	return out;
}
