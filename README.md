# @cleave-protocol/ai-sdk

Cleave swap tools for [Vercel AI SDK](https://ai-sdk.dev) agents.

Cleave is a DEX aggregator on Ethereum, Arbitrum, Base, BNB Chain, Polygon
and Optimism. It splits a trade across pools and paths, and swaps between
chains in one step. Quotes include Cleave's fees in the price.

These tools plan swaps and return unsigned calls. The user's own wallet
signs and sends them. They sign nothing; the only thing they send is a gas
order the wallet has signed.

## Install

```sh
npm install @cleave-protocol/ai-sdk ai zod
```

No API key is needed.

## Usage

```ts
import { generateText, isStepCount } from 'ai';
import { cleaveTools } from '@cleave-protocol/ai-sdk';

const { text } = await generateText({
  model: 'openai/gpt-5-mini',
  prompt:
    'Plan a swap of 25 USDC to WETH on Base for wallet 0x00000000000000000000000000000000000A11cE.',
  tools: cleaveTools(),
  stopWhen: isStepCount(5),
});

console.log(text);
```

On `ai` 6, use `stepCountIs` in place of `isStepCount`.

`cleaveTools()` includes `getGas`. Its second call passes a gas order the
wallet has signed to Cleave's relayer. That call waits for your approval
by default; see [Approving a gas order](#approving-a-gas-order).

Each tool can also be added on its own:

```ts
import { findToken, planSwap } from '@cleave-protocol/ai-sdk';

const tools = { planSwap: planSwap(), findToken: findToken() };
```

## Tools

The tools match Cleave's MCP server tools and call the public
[Agent REST API](https://cleave.fi/docs/agents/rest).

| Tool | MCP tool | What it does |
| --- | --- | --- |
| `planSwap` | `cleave_plan_swap` | Plans a swap on one chain, a cross-chain swap or a bridge, and returns unsigned calls in signing order |
| `trackSwap` | `cleave_track_swap` | Reports the state of a sent plan or gas order, and what arrived |
| `findToken` | `cleave_find_token` | Finds a token by symbol or address and flags look-alikes |
| `getGas` | `cleave_get_gas` | Offers native gas for USDC, then passes the order the wallet signed to Cleave's relayer |

The usual flow:

1. `findToken`, when a symbol is ambiguous.
2. `planSwap`, with the wallet, the tokens and the amount.
3. The wallet signs the returned `calls` in order, before `validUntil`.
4. `trackSwap`, with the chain, the transaction hash and the plan's
   `requestId`.

Check with `trackSwap` before sending a plan again: a plan still in flight
that is sent twice can pay twice.

A plan states its notices first, then the outcome kind, the costs charged
by others, the expected time and `validUntil`. A `block` notice means no
calls. A `warn` notice, or a recipient other than the wallet, sets
`requiresConfirmation`. The token to receive must be on Cleave's token
list.

Before any wallet signs, show the user the warnings, recipient, amounts
and slippage, and get their confirmation. Do not raise slippage above the
default 50 bps without the user's consent. Your signer enforces this: the
tools only plan.

`findToken` returns up to ten candidates for a symbol. When the user can
give a verified contract address, prefer it to a symbol.

Field-by-field answers are documented at
[cleave.fi/docs/agents/mcp](https://cleave.fi/docs/agents/mcp).

## Keys and signing

- The tools take no private keys.
- They sign nothing; the only thing they send is a gas order the wallet
  has signed.
- `planSwap` returns unsigned calls as `{ chainId, from, to, data, value }`.
- `getGas` returns an offer with one USDC authorization to sign. Called
  again with that offer, the wallet and the wallet's signature, it passes
  the signed order to Cleave's relayer. That second call has
  `needsApproval` set, so the AI SDK asks for your approval before it runs.

## Address checks

Before a `planSwap` plan or a `getGas` offer reaches the model, the package
checks it against per-chain contract addresses, rails and tokens pinned in
this package:

- `planSwap`: every call is on the planned chain and from the wallet. The
  last call goes to a listed contract and function that fits the route,
  sends to the planned chain and pays the requested recipient where its
  calldata names one; refunds go to the wallet. Any call before it is an
  approve of the sell token to that contract for exactly what the last
  call pulls. For USDC and the chain's native or wrapped native coin, the
  amount sold is the requested amount. The native value is what the
  native amount sold and the Stargate native messaging fee need.
- `getGas`: the authorization is a USDC `ReceiveWithAuthorization` from
  the wallet on the paying chain. The order carries the requested amount,
  recipient and refund address, the pinned contracts, rail and fee
  recipient, and the fee and amounts the offer shows. The order hash and
  the payment address are recomputed and must match what is signed.

A plan or offer that fails a check is not passed on; the tool returns only
this:

```json
{
  "error": {
    "code": "address_not_allowed",
    "message": "P2: the main call's target is not on the allowlist",
    "retryable": false
  }
}
```

A plan or offer that passes is returned with only its documented
top-level fields.

What these checks do not cover:

- The price, the route and the amount received.
- On routes that swap on arrival or pay a fee through the bridge message,
  the funds go to the Across handler or Cleave's composer, and that
  message decides who receives them. These checks do not read it, so a
  compromised API could redirect those funds. Have a person check such a
  plan before signing.
- When `sellToken` is a symbol other than USDC or the chain's native or
  wrapped native coin, the API resolves it to an address. Check
  `send.token` before signing.
- For any other sell token, given by symbol or by address, the package
  does not know its decimals, so the amount in the approve and the
  calldata is not checked against the request. Check the approve amount
  and `pullsAtMost` before signing.
- `next` and the notices are text from the API.

After Cleave redeploys a contract, plans that use it fail these checks
until a package update pins the new address.

`checkPlanSwap` and `checkGetGas` are exported for agents that call the
API directly.

Do not pair these tools with a wallet that signs without a human looking.

## Gas top-ups

`getGas` takes two calls.

1. The offer: `payChainId`, `chainId`, `recipient` and `amount`.
   - `typedData`, the USDC authorization to sign, comes back only when
     `wallet` is passed.
   - An order from another chain needs `wallet` or `refundTo`. On one
     chain, a refund goes to `refundTo`, else `wallet`, else the recipient.
   - `amount` is USDC with at most 6 decimals, from 2 to 50 USDC; gas
     delivered on Ethereum needs at least 5 USDC.
2. The order: `offer`, `wallet` and `signature`. The tool passes the
   signed order to Cleave's relayer.

An authorization that is never used never debits the wallet. Once an
order is funded, follow `trackSwap` with its `requestId`
(`g:<payChainId>:<orderHash>`) and report the status it gives; do not
assume a refund.

### Approving a gas order

The second `getGas` call has `needsApproval` set, so `generateText` stops
with a `tool-approval-request` instead of running it. Your app shows the
request to the user and resumes with their answer:

```ts
import { generateText, isStepCount } from 'ai';
import type { ModelMessage, ToolApprovalResponse } from 'ai';
import { cleaveTools } from '@cleave-protocol/ai-sdk';

const tools = cleaveTools();
const messages: ModelMessage[] = [
  { role: 'user', content: 'Submit the gas order my wallet just signed.' },
];

const first = await generateText({
  model: 'openai/gpt-5-mini',
  tools,
  messages,
  stopWhen: isStepCount(5),
});
messages.push(...first.response.messages);

const approvals: ToolApprovalResponse[] = [];
for (const part of first.content) {
  if (part.type === 'tool-approval-request') {
    approvals.push({
      type: 'tool-approval-response',
      approvalId: part.approvalId,
      approved: await confirmWithUser(part.toolCall.input),
    });
  }
}

if (approvals.length > 0) {
  messages.push({ role: 'tool', content: approvals });
  const second = await generateText({
    model: 'openai/gpt-5-mini',
    tools,
    messages,
    stopWhen: isStepCount(5),
  });
  console.log(second.text);
}
```

`confirmWithUser` stands for your own prompt to the user.

- This approval comes after the wallet has signed. Before the wallet
  signs, show the user the order from the offer: the payer, the
  recipient, the refund address, the amount and the fee.
- Calling a tool's `.execute()` directly skips the AI SDK's approval step.
- `getGasApproval: false` turns the approval off.

## Options

Every factory, and `cleaveTools`, takes the same optional settings:

```ts
cleaveTools({
  baseUrl: 'https://api.cleave.fi',
  apiKey: process.env.CLEAVE_API_KEY,
  timeoutMs: 30000,
  fetch: globalThis.fetch,
  getGasApproval: true,
});
```

| Option | Default | Meaning |
| --- | --- | --- |
| `baseUrl` | `https://api.cleave.fi` | API origin |
| `apiKey` | none | Optional partner key, sent to `baseUrl` as `Authorization: Bearer`. An unknown or revoked key fails every call with `unauthorized`; there is no keyless fallback |
| `timeoutMs` | `30000` | Time limit for each call, combined with the AI SDK's abort signal |
| `fetch` | `globalThis.fetch` | A custom fetch |
| `getGasApproval` | `true` | Whether `getGas` asks for approval before passing a signed order |

## Errors

From `planSwap` and `getGas`, a refusal from the API comes back as the
tool's result with only its `apiVersion`, `requestId` and `error` fields,
so the model can read it. `trackSwap` and `findToken` return it unchanged:

```json
{
  "apiVersion": "1",
  "requestId": "...",
  "error": {
    "code": "not_found",
    "reason": "unknown_order",
    "message": "...",
    "detail": "...",
    "retryable": false
  }
}
```

`retryable: true` means the same call can succeed later; `retryAfterSec`,
when present, says when.

`CleaveApiError` is thrown when there is no API answer to return:

- a network error, a timeout or an abort: `status` is `0` and `cause`
  holds the original error;
- an answer that is not JSON: `status` is the HTTP status.

`requestId` carries the `x-request-id` header when the API sent one.

Aborting a call, or a timeout, does not cancel a gas order the API has
already accepted. If a `getGas` submission fails this way, track
`g:<payChainId>:<orderHash>` from the first offer before signing a new
one.

## Server side only

Run these tools on a server, in a bot or in agent code. The Agent REST API
refuses requests that carry an `Origin` header, as browsers send, with
`403` and code `forbidden_origin`.

## Limits

- Without a key, each client IP can make 40 requests per 10 seconds and
  120 per minute.
- From a recognised hosted platform, where many agents share one address,
  a request with a valid `wallet` in its body is counted by that wallet
  instead. `findToken` and `trackSwap` take no `wallet`, so they stay
  counted by IP.
- With `apiKey`, calls count against the partner key's own limits.
- All keyless agents share one planning capacity, used by `planSwap` and
  by `getGas` offers; a cross-chain plan or offer counts twice. When it is
  busy, the answer is `rate_limited` with reason `agent_limit` and a short
  `retryAfterSec`.

## Links

- [Cleave for agents](https://cleave.fi/docs/agents)
- [Agent REST API](https://cleave.fi/docs/agents/rest)
- [Gas top-up](https://cleave.fi/docs/agents/gas)
- [MCP server](https://cleave.fi/docs/agents/mcp): `https://api.cleave.fi/mcp`

Use of the API is subject to Cleave's
[Terms of Use](https://cleave.fi/terms) and
[Privacy Policy](https://cleave.fi/privacy).

## License

MIT
