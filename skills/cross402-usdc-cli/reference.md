# cross402-usdc CLI Reference

## Installation

```bash
npm install -g @cross402/usdc
# or use via npx without installing
```

## Config file

- **Path**: `~/.cross402-usdc/config.json`
- **Fields**: `apiKey`, `secretKey`, `baseUrl`
- **Sessions**: stored under `~/.cross402-usdc/sessions/<intentId>.json`

## Auth commands

### auth set

```bash
cross402-usdc auth set --api-key <key> --secret-key <key> --base-url <url>
```

All three required. Use flags or env vars: `PAY_API_KEY`, `PAY_SECRET_KEY`, `PAY_BASE_URL`.

### auth show

Shows current config. Secret key is masked (first 4 + last 4 chars visible).

### auth clear

Removes `~/.cross402-usdc/config.json` (sessions preserved).

### balance read

```bash
cross402-usdc balance read --address <0x...> [--rpc-url <url>]
```

Reads USDC balance of an address on Base mainnet. Uses USDC contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` and RPC `https://mainnet.base.org` by default.

- `--address` — Agent wallet address (0x + 40 hex chars). Env var: `PAY_AGENT_ADDRESS`
- `--rpc-url` — Base RPC URL. Env var: `PAY_BASE_RPC_URL`

Output: JSON with `address`, `usdcContract`, `rpcUrl`, `balanceRaw`, `balanceUsdc`.

### reset

```bash
cross402-usdc reset [--yes]
```

Removes **all** stored config and sessions.

## Flow A: Server-side commands (require auth)

### intent create

```bash
cross402-usdc intent create --amount <val> --payer-chain <chain> [--email <e> | --recipient <r>]
```

- `--amount` — e.g. `10.00`
- `--payer-chain` — `solana` or `base`
- Exactly one of `--email` or `--recipient`

Output: JSON. Extract `intentId` and pass as positional argument to `execute` and `get`.
The CLI also stores the created intent as a local session.

Env vars: `PAY_AMOUNT`, `PAY_PAYER_CHAIN`, `PAY_EMAIL`, `PAY_RECIPIENT`.

### intent execute

```bash
cross402-usdc intent execute [intent-id]
```

Executes transfer on Base via the Agent backend wallet. No signing required from the caller.
If `intent-id` is omitted, uses the latest active session or `PAY_INTENT_ID` env var.

### intent get

```bash
cross402-usdc intent get [intent-id]
```

Returns intent status and receipt.
If `intent-id` is omitted, uses the latest active session or `PAY_INTENT_ID` env var.

**Ownership policy**: when the request reaches the v2 endpoint, the server checks the intent's `agent_id` against the API key's agent. Intents owned by another agent — and intents created via the unauthenticated `/api` flow (no agent) — return **HTTP 404** with the same body string as a missing intent (`"payment intent not found"`). This is intentional: collapsing 403 and 404 to the same response prevents authenticated callers from probing for valid intent IDs across other agents by observing the 403/404 split. The same policy applies to `intent execute`.

### intent list

```bash
cross402-usdc intent list [--page <n>] [--page-size <n>]
```

Returns the **server-side** paginated list of intents owned by the authenticated agent, most recent first. Distinct from `intent sessions`, which only inspects the local on-disk session cache.

- `--page` is 1-indexed (server caps at 1,000,000)
- `--page-size` must be in `[1, 100]` (server default 20)
- Both flags are optional; omit either to use the server default

The response body has shape `{ intents: [...], total: N, page: N, pageSize: N }`. Each list row carries `agentId`, `intentId`, `status`, `payerChain`, `targetChain`, the settlement-quote fields, and timestamps.

### intent sessions

```bash
cross402-usdc intent sessions [--expired]
```

Lists stored sessions (local file cache only — does not hit the API). Use `intent list` for the server-side history.

### me

```bash
cross402-usdc me
```

Returns the calling agent's identity from the `/v2/me` endpoint:

```json
{
  "agentId": "uuid",
  "agentNumber": "A-001",
  "name": "demo agent",
  "status": "ACTIVE",
  "walletAddress": "0x...",
  "solanaWalletAddress": "..."
}
```

Cheap to call — the backend reads from middleware context and does not hit the database. Useful as a startup credential check and for discovering the agent's funded EVM/Solana wallet addresses.

## Flow B: Client-side / payer-side (no auth required)

### intent submit-proof

```bash
cross402-usdc intent submit-proof <intent-id> --proof <settle-proof> [--base-url <url>]
```

Used when the **payer holds their own wallet** and has already signed an X402 payment off-chain.
No `apiKey` or `secretKey` required. `baseUrl` from `--base-url` or stored config.

Env var for proof: `PAY_SETTLE_PROOF`.

## Supported chains

| Chain | `--payer-chain` value |
|-------|-----------------------|
| Solana | `solana` |
| Base | `base` |

All payments settle on Base. `--payer-chain` is the source chain only.

## Error handling

- Missing config: Run `cross402-usdc auth set` first.
- Missing required params: CLI exits with descriptive error message.
- Backend errors: Message printed to stderr, exits with code 1.
