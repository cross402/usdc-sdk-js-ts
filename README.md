# @cross402/usdc (JS & TS)

[![npm version](https://img.shields.io/npm/v/@cross402/usdc.svg)](https://www.npmjs.com/package/@cross402/usdc)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org)

Javascript & TypeScript client for the Agent Tech payment API — create intents, execute USDC transfers, and query status.

- **Lightweight** — two small runtime deps for key conversion; uses built-in `fetch` (Node 18+)
- **Dual ESM + CommonJS** — works in TypeScript and JavaScript projects
- **Two clients** — `PayClient` (authenticated, server-side) and `PublicPayClient` (unauthenticated, payer-side)
- **Bearer token authentication** for PayClient
- **Multi-chain settlement** — specify `targetChain` to settle on any supported chain (defaults to `base`)

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Direct Imports (Server / Client)](#direct-imports-server--client)
- [CLI](#cli)
- [Cursor Skills](#skills)
- [Clients](#clients)
  - [PayClient (Authenticated)](#payclient-authenticated)
  - [PublicPayClient (Unauthenticated)](#publicpayclient-unauthenticated)
- [Authentication](#authentication)
- [Intent Lifecycle](#intent-lifecycle)
- [Supported Chains](#supported-chains)
- [Fee Breakdown](#fee-breakdown)
- [Error Handling](#error-handling)
- [Advanced](#advanced)

## Install

```bash
npm install @cross402/usdc
```

## Quick Start

### TypeScript (ESM)

```ts
import { PayClient, IntentStatus } from "@cross402/usdc";

const client = new PayClient({
  baseUrl: "https://api-pay.agent.tech",
  auth: { apiKey: "your-api-key", secretKey: "your-secret-key" },
});

// 1. Create intent
const resp = await client.createIntent({
  email: "merchant@example.com",
  amount: "100.50",
  payerChain: "solana",
});
console.log("Intent ID:", resp.intentId);

// 2. Execute transfer (backend signs with Agent wallet)
const exec = await client.executeIntent(resp.intentId);
console.log("Status:", exec.status);

// 3. Query full receipt
const intent = await client.getIntent(resp.intentId);
console.log("Final status:", intent.status);
```

### JavaScript (CommonJS)

```js
const { PayClient } = require("@cross402/usdc");

const client = new PayClient({
  baseUrl: "https://api-pay.agent.tech",
  auth: { apiKey: "your-api-key", secretKey: "your-secret-key" },
});

async function main() {
  const resp = await client.createIntent({
    email: "merchant@example.com",
    amount: "100.50",
    payerChain: "solana",
  });
  console.log("Intent ID:", resp.intentId);
}
main();
```

### Run the bundled example

```bash
git clone https://github.com/cross402/usdc-sdk-js-ts
cd usdc-sdk-js-ts
npm install

PAY_BASE_URL=https://api-pay.agent.tech \
PAY_API_KEY=your-api-key \
PAY_SECRET_KEY=your-secret-key \
npx tsx examples/basic.ts
```

Set `PAY_INTENT_ID` to skip creation and query an existing intent instead.

## Direct Imports (Server / Client)

For clearer separation of concerns, use dedicated entry points:

**Server-side** (contains `secretKey` — use only on the backend):

```ts
import { PayClient } from "@cross402/usdc/server";

const client = new PayClient({
  baseUrl: "https://api-pay.agent.tech",
  auth: { apiKey: "your-api-key", secretKey: "your-secret-key" },
});
```

**Client-side** (no secret credentials — safe for browser / payer-side code):

```ts
import { PublicPayClient } from "@cross402/usdc/client";

const client = new PublicPayClient({
  baseUrl: "https://api-pay.agent.tech",
});
```

The default `@cross402/usdc` entry still exports both clients for backward compatibility.

## CLI

The package includes a CLI (`cross402-usdc`) for auth management and intent operations.

### Install & run

```bash
npm install -g @cross402/usdc
cross402-usdc --help
```

Or run via `npx`:

```bash
npx @cross402/usdc auth show
```

### Auth commands

| Command | Description |
|---------|-------------|
| `cross402-usdc auth set --api-key <key> --secret-key <key> --base-url <url>` | Save credentials to `~/.cross402-usdc/config.json` |
| `cross402-usdc auth show` | Show current config (secret key masked) |
| `cross402-usdc auth clear` | Remove stored config |
| `cross402-usdc balance read --address <addr> [--rpc-url <url>]` | Read agent USDC balance from Base chain (default RPC: https://mainnet.base.org) |
| `cross402-usdc reset [--yes]` | Remove **all** stored config + sessions |

Env vars `PAY_API_KEY`, `PAY_SECRET_KEY`, `PAY_BASE_URL` can be used instead of flags for `auth set`.

### Intent commands

Requires auth config (except `submit-proof`). Use `auth set` first.

| Command | Description |
|---------|-------------|
| `cross402-usdc intent create --amount <val> --payer-chain <chain> [--email <e> \| --recipient <r>]` | Create intent (server-side) |
| `cross402-usdc intent execute [intent-id]` | Execute intent (server-side). If omitted, uses latest active session |
| `cross402-usdc intent get [intent-id]` | Get intent status (server-side). If omitted, uses latest active session |
| `cross402-usdc intent submit-proof <intent-id> --proof <settle-proof>` | Submit settle proof (client-side, no auth) |
| `cross402-usdc intent sessions [--expired]` | List stored sessions (optionally expired only) |

For `submit-proof`, `--base-url` or stored config is used; no secret key required.

## Skills

### npx (skills.sh)

```bash
npx skills add cross402/usdc-sdk-js-ts
```

The `skills` CLI uses the format `npx skills add <github-org>/<github-repo>`. See [skills.sh documentation](https://skills.sh/docs).

### Clawhub

```bash
clawhub skills add cross402/usdc-sdk-js-ts
```

Install the same skill via [Clawhub](https://clawhub.ai) with the same `<org>/<repo>` format.

## Clients

The SDK provides two client classes for different use cases.

### PayClient (Authenticated)

Server-side client that uses `/v2` endpoints with authentication. The backend Agent wallet signs and executes transfers — no wallet or signing required on your side.

```ts
import { PayClient } from "@cross402/usdc";

const client = new PayClient({
  baseUrl: "https://api-pay.agent.tech",
  auth: { apiKey: "id", secretKey: "secret" },
});

const intent = await client.createIntent({ email: "merchant@example.com", amount: "10.00", payerChain: "solana" });
const exec   = await client.executeIntent(intent.intentId);
const status = await client.getIntent(intent.intentId);
```

| Method | Endpoint | Description |
|---|---|---|
| `createIntent(req)` | `POST /v2/intents` | Create a payment intent |
| `executeIntent(id)` | `POST /v2/intents/{id}/execute` | Execute transfer on Base with Agent wallet |
| `getIntent(id)` | `GET /v2/intents?intent_id=...` | Get intent status and receipt |

### PublicPayClient (Unauthenticated)

Client-side / payer-side client that uses `/api` endpoints without authentication. Use this when the integrator holds the payer's wallet and can sign X402 payments and submit settle proofs directly.

Both clients use the same `baseUrl` (API root without path prefix, e.g. `https://api-pay.agent.tech`).

```ts
import { PublicPayClient } from "@cross402/usdc";

const client = new PublicPayClient({
  baseUrl: "https://api-pay.agent.tech",
});

const intent = await client.createIntent({ recipient: "0x...", amount: "10.00", payerChain: "base" });
// ... payer signs X402 payment off-chain ...
const result = await client.submitProof(intent.intentId, "settle_proof_string");
const status = await client.getIntent(intent.intentId);
```

| Method | Endpoint | Description |
|---|---|---|
| `createIntent(req)` | `POST /api/intents` | Create a payment intent |
| `submitProof(id, proof)` | `POST /api/intents/{id}` | Submit settle proof after X402 payment |
| `getIntent(id)` | `GET /api/intents?intent_id=...` | Get intent status and receipt |

## Authentication

Authentication applies to `PayClient` only. `PublicPayClient` requires no credentials.

### Bearer token

Base64-encodes `apiKey:secretKey` and sends it as `Authorization: Bearer <token>`.

```ts
const client = new PayClient({
  baseUrl,
  auth: { apiKey: "api-key", secretKey: "secret-key" },
});
```

### Custom fetch / timeout

The default timeout is **30 seconds** for both clients. Override with options:

```ts
const client = new PayClient({
  baseUrl,
  auth: { apiKey: "id", secretKey: "secret" },
  timeoutMs: 60_000,
});

// PublicPayClient supports the same options (minus auth)
const publicClient = new PublicPayClient({ baseUrl, timeoutMs: 60_000 });
```

Or provide a custom `fetcher` implementation (timeout is ignored when custom fetcher is provided):

```ts
const client = new PayClient({
  baseUrl,
  auth: { apiKey: "id", secretKey: "secret" },
  fetcher: myCustomFetcher,
});
```

## Intent Lifecycle

Intents expire **10 minutes** after creation.

```
                          ┌──────────────────┐
                          │ AWAITING_PAYMENT  │
                          └────────┬─────────┘
                                   │
                      ┌────────────┼────────────┐
                      │            │            │
                      ▼            ▼            ▼
               ┌──────────┐ ┌──────────┐ ┌─────────────────────┐
               │ EXPIRED  │ │ PENDING  │ │ VERIFICATION_FAILED │
               └──────────┘ └────┬─────┘ └─────────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ SOURCE_SETTLED │
                        └───────┬────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ BASE_SETTLING │
                        └───────┬───────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ BASE_SETTLED │
                        └──────────────┘
```

Use the status constants instead of bare strings:

| Constant | Value | Description |
|---|---|---|
| `IntentStatus.AwaitingPayment` | `AWAITING_PAYMENT` | Intent created, waiting for execution |
| `IntentStatus.Pending` | `PENDING` | Execution initiated, processing |
| `IntentStatus.VerificationFailed` | `VERIFICATION_FAILED` | Source payment verification failed (terminal) |
| `IntentStatus.SourceSettled` | `SOURCE_SETTLED` | Source chain payment confirmed |
| `IntentStatus.BaseSettling` | `BASE_SETTLING` | USDC transfer on Base in progress |
| `IntentStatus.BaseSettled` | `BASE_SETTLED` | Transfer complete — check `basePayment` for receipt (terminal) |
| `IntentStatus.Expired` | `EXPIRED` | Intent was not executed within 10 minutes (terminal) |

## Supported Chains

| Chain | Identifier | `payerChain` | `targetChain` |
|---|---|---|---|
| Solana | `solana` | ✅ | — |
| Base | `base` | ✅ | ✅ (default) |
| BSC | `bsc` | ✅ | ✅ |
| Polygon | `polygon` | ✅ | ✅ |
| Arbitrum | `arbitrum` | ✅ | ✅ |
| Ethereum | `ethereum` | ✅ | ✅ |
| Monad | `monad` | ✅ | — |
| HyperEVM | `hyperevm` | ✅ | — |

Use `payerChain` to specify the chain the payer sends from. Use `targetChain` to specify the settlement chain for the recipient (defaults to `base` when omitted).

## Fee Breakdown

The `FeeBreakdown` interface is included in all intent response types (via `IntentBase`):

| Field | JSON | Description |
|---|---|---|
| `sourceChain` | `source_chain` | Source chain identifier |
| `sourceChainFee` | `source_chain_fee` | Gas/network fee on the source chain |
| `targetChain` | `target_chain` | Target chain (always `"base"`) |
| `targetChainFee` | `target_chain_fee` | Gas/network fee on Base |
| `platformFee` | `platform_fee` | Platform service fee |
| `platformFeePercentage` | `platform_fee_percentage` | Platform fee as a percentage |
| `totalFee` | `total_fee` | Sum of all fees |

**Amount rules:**
- Minimum: **0.02 USDC**
- Maximum: **1,000,000 USDC**
- Up to **6 decimal places** (e.g. `"0.000001"`, `"123.45"`)

## Error Handling

The SDK uses two error classes:

**`PayApiError`** — thrown for non-2xx HTTP responses from the API:

```ts
import { PayApiError } from "@cross402/usdc";

try {
  await client.createIntent(req);
} catch (err) {
  if (err instanceof PayApiError) {
    console.log(`HTTP ${err.statusCode}: ${err.message}`);
  }
}
```

**`PayValidationError`** — thrown when the SDK rejects a request before it reaches the API. Input validation is implemented with [Zod](https://zod.dev); error messages follow the format `validation: <message>`.

```ts
import { PayValidationError } from "@cross402/usdc";

try {
  await client.executeIntent("");
} catch (err) {
  if (err instanceof PayValidationError) {
    console.log(`Invalid input: ${err.message}`);
  }
}
```

**When `PayValidationError` is thrown:**

| Context | Rule |
|---|---|
| **Client constructor** | `baseUrl` is required and must not be empty |
| **PayClient constructor** | `auth.apiKey` and `auth.secretKey` are required and must not be empty |
| **createIntent** | `request` is required; exactly one of `email` or `recipient` must be provided; `amount` is required, must be a valid number, and ≥ 0.02 USDC; `payerChain` is required and must not be empty; `targetChain` is optional |
| **executeIntent / getIntent** | `intentId` is required and must not be empty |
| **submitProof** (PublicPayClient) | `intentId` and `settleProof` are required and must not be empty |

| Status Code | Meaning |
|---|---|
| 400 | Bad request — invalid parameters, amount out of range, or malformed input |
| 401 | Unauthorized — missing or invalid credentials |
| 403 | Forbidden — insufficient permissions for this operation |
| 404 | Not found — intent does not exist |
| 429 | Rate limited — too many requests (60 req/min/IP typical) |
| 503 | Service unavailable — temporary backend issue |

## Advanced

### AbortSignal for cancellation

All API methods accept an optional `AbortSignal` for cancellation:

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const resp = await client.createIntent(req, controller.signal);
```

### Rate limiting

The API allows approximately **60 requests per IP per minute**. On HTTP 429, implement exponential backoff:

```ts
try {
  await client.getIntent(id);
} catch (err) {
  if (err instanceof PayApiError && err.statusCode === 429) {
    await sleep(backoff);
    // retry
  }
}
```
