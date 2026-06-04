import { parseArgs } from "util";

// ── Config ──────────────────────────────────────────────────────────────────
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const NETWORK = process.env.NETWORK || "base-sepolia";
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// ── Parse args ──────────────────────────────────────────────────────────────
const { values } = parseArgs({
  args: Bun.argv,
  options: {
    endpoint: { type: "string", default: "/v1/research" },
    query: { type: "string", default: "AI agents 2026" },
    pay: { type: "boolean", default: false },
  },
  strict: false,
  allowPositionals: true,
});

const endpoint = values.endpoint as string;
const query = values.query as string;
const shouldPay = values.pay as boolean;

// ── Helpers ─────────────────────────────────────────────────────────────────
async function fetchWithRetry(url: string, headers: Record<string, string> = {}, maxRetries = 2): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, { headers });
    if (res.status !== 402 || i === maxRetries - 1) return res;
    // Got 402 — extract payment and retry
    const body = await res.json();
    console.log(`\n💳 Payment required: ${body.payment?.maxAmountRequired || "?"} USDC`);
    console.log(`   Resource: ${body.payment?.resource}`);
    console.log(`   Network: ${body.payment?.network}`);
    if (!shouldPay) {
      console.log("\n⚠️  Skipping payment (use --pay flag to simulate payment)");
      return res;
    }
    // In production: sign payment payload and retry with PAYMENT-SIGNATURE header
    console.log("   (Simulating payment acceptance)");
    return res;
  }
  throw new Error("Max retries exceeded");
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const url = `${SERVER_URL}${endpoint}?topic=${encodeURIComponent(query)}`;
  console.log(`\n🔍 Calling: ${url}`);

  const res = await fetchWithRetry(url);
  const body = await res.json();

  if (res.status === 402) {
    console.log("\n📋 Payment Required Response:");
    console.log(JSON.stringify(body, null, 2));
    console.log("\nTo pay: sign the payment payload and retry with PAYMENT-SIGNATURE header");
    console.log("Docs: https://docs.cdp.coinbase.com/x402/welcome");
  } else {
    console.log("\n✅ Response:");
    console.log(JSON.stringify(body, null, 2));
  }
}

main().catch(console.error);
