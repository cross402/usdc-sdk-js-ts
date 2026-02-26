# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript SDK (package `@anthropic/pay`) for the Agent Tech v2 payment API. Provides a thin HTTP client for creating payment intents, executing USDC transfers on Base chain (via the backend's Agent wallet), and querying intent status. No wallet or signing logic on the client side.

## Build & Run Commands

```bash
# Install dependencies
npm install

# Build the SDK (emits to dist/)
npm run build

# Run tests
npm test

# Type-check without emitting
npm run typecheck

# Run the example
PAY_BASE_URL=https://api-pay.agent.tech/api PAY_CLIENT_ID=id PAY_CLIENT_SECRET=secret npx tsx examples/basic.ts
```

Zero runtime dependencies. Dev dependencies: `typescript`, `vitest`.

## Architecture

The entire SDK is a single package with four source files in `src/`:

- **`src/errors.ts`** — `PayApiError` (extends `Error`, has `statusCode`) and `PayValidationError` (extends `Error`). Use `instanceof` to distinguish.
- **`src/types.ts`** — All interfaces and constants: `IntentStatus` const object (7 values), `CreateIntentRequest`, `IntentBase`, `FeeBreakdown`, `PaymentRequirements`, `SourcePayment`, `BasePayment`, response types, and `ErrorResponse`.
- **`src/client.ts`** — `PayClient` class and all API methods (`createIntent`, `executeIntent`, `getIntent`). Contains the private `do()` helper for building/executing HTTP requests and `parseError()` for non-2xx responses. Auth types (`BearerAuth`, `ApiKeyAuth`) and `PayClientOptions` interface. Exports `keysToSnake`/`keysToCamel` helpers for JSON key conversion at serialization boundaries.
- **`src/index.ts`** — Barrel file with all named exports (no default exports).

All API paths are prefixed with `/v2`. The `baseUrl` passed to the constructor should be the API root *without* `/v2`.

`examples/basic.ts` is a runnable demo that reads credentials from environment variables and supports both auth modes.

`tests/client.test.ts` contains 25 test cases using vitest with mock fetch functions.
