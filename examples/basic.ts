/**
 * Example: create a client, create an intent, execute transfer, then query.
 *
 * Run from repo root:
 *
 *   PAY_BASE_URL=https://api-pay.agent.tech \
 *   PAY_CLIENT_ID=id \
 *   PAY_CLIENT_SECRET=secret \
 *   npx tsx examples/basic.ts
 *
 * To use header-based auth instead:
 *
 *   PAY_BASE_URL=... PAY_CLIENT_ID=... PAY_API_KEY=key npx tsx examples/basic.ts
 *
 * Set PAY_EMAIL to override the default merchant email (merchant@example.com).
 *
 * To only query an existing intent:
 *
 *   PAY_BASE_URL=... PAY_CLIENT_ID=... PAY_CLIENT_SECRET=... PAY_INTENT_ID=uuid npx tsx examples/basic.ts
 */

import { PayClient } from "../src/index.js";
import type { Auth } from "../src/index.js";

const baseUrl = process.env.PAY_BASE_URL ?? "";
const clientId = process.env.PAY_CLIENT_ID ?? "";
const clientSecret = process.env.PAY_CLIENT_SECRET ?? "";
const apiKey = process.env.PAY_API_KEY ?? "";
const intentId = process.env.PAY_INTENT_ID ?? "";

if (!baseUrl || !clientId) {
  console.error(
    "Set PAY_BASE_URL, PAY_CLIENT_ID, and one of PAY_CLIENT_SECRET or PAY_API_KEY.",
  );
  process.exit(1);
}

function getAuth(): Auth {
  if (apiKey) return { type: "apiKey", clientId, apiKey };
  if (clientSecret) return { type: "bearer", clientId, clientSecret };
  console.error("Provide PAY_CLIENT_SECRET or PAY_API_KEY.");
  process.exit(1);
}

const auth = getAuth();
const client = new PayClient({ baseUrl, auth });

if (intentId) {
  const intent = await client.getIntent(intentId);
  console.log(JSON.stringify(intent, null, 2));
  process.exit(0);
}

const email = process.env.PAY_EMAIL || "merchant@example.com";

const resp = await client.createIntent({
  email,
  amount: "10.00",
  payerChain: "solana",
});

console.log(`Intent created: ${resp.intentId}`);
console.log(`Status: ${resp.status}`);

const exec = await client.executeIntent(resp.intentId);

console.log(`Execute result status: ${exec.status}`);
console.log(JSON.stringify(exec, null, 2));
