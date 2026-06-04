import { serve } from "bun";

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);
const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";
const NETWORK = process.env.NETWORK || "base-sepolia";
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC on base-sepolia
const PRICE_USDC = parseFloat(process.env.PRICE_AMOUNT || "0.01");
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";

// ── Helpers ─────────────────────────────────────────────────────────────────
function toHex(num: number): string {
  return "0x" + num.toString(16);
}

function buildPaymentRequired(resource: string, amount: number) {
  const payload = {
    scheme: "exact",
    network: NETWORK,
    maxAmountRequired: toHex(Math.floor(amount * 1e6)), // USDC 6 decimals
    resource,
    description: `Access to ${resource}`,
    mimeType: "application/json",
    payTo: SERVER_WALLET,
    maxTimeoutSeconds: 300,
    asset: TOKEN_ADDRESS,
  };
  return {
    statusCode: 402,
    headers: {
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
    body: JSON.stringify({
      error: "Payment Required",
      payment: payload,
      facilitator: FACILITATOR_URL,
    }),
  };
}

// ── Mock agent work ─────────────────────────────────────────────────────────
async function doResearch(topic: string): Promise<Record<string, unknown>> {
  // In production: call web_search, synthesize, return structured result
  return {
    topic,
    sources: 5,
    summary: `Research summary for: ${topic}`,
    generated_at: new Date().toISOString(),
  };
}

async function findLeads(query: string): Promise<Record<string, unknown>> {
  return {
    query,
    leads: [
      { name: "Example Corp", email: "hello@example.com", score: 8 },
      { name: "Sample Inc", email: "contact@sample.io", score: 6 },
    ],
    generated_at: new Date().toISOString(),
  };
}

async function generateContent(topic: string): Promise<Record<string, unknown>> {
  return {
    topic,
    content: `Generated content for: ${topic}`,
    word_count: 500,
    generated_at: new Date().toISOString(),
  };
}

// ── Server ──────────────────────────────────────────────────────────────────
console.log(`\n🚀 AI Agent Money Loop running on http://localhost:${PORT}`);
console.log(`   Wallet: ${SERVER_WALLET}`);
console.log(`   Network: ${NETWORK}`);
console.log(`   Price: ${PRICE_USDC} USDC per request\n`);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, PAYMENT-SIGNATURE, PAYMENT-RESPONSE",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check (free)
    if (path === "/health") {
      return Response.json(
        { status: "ok", service: "ai-agent-money-loop", version: "0.1.0" },
        { headers: corsHeaders }
      );
    }

    // Paid endpoints
    let resource = "";
    let price = PRICE_USDC;
    let handler: () => Promise<Record<string, unknown>>;

    if (path === "/v1/research") {
      const topic = url.searchParams.get("topic") || "general";
      resource = `/v1/research?topic=${encodeURIComponent(topic)}`;
      handler = () => doResearch(topic);
    } else if (path === "/v1/leads") {
      const query = url.searchParams.get("query") || "AI agents";
      resource = `/v1/leads?query=${encodeURIComponent(query)}`;
      handler = () => findLeads(query);
    } else if (path === "/v1/content") {
      const topic = url.searchParams.get("topic") || "AI agents";
      resource = `/v1/content?topic=${encodeURIComponent(topic)}`;
      handler = () => generateContent(topic);
    } else {
      return Response.json(
        { error: "Not found", endpoints: ["/health", "/v1/research", "/v1/leads", "/v1/content"] },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check for payment signature
    const paymentSig = req.headers.get("PAYMENT-SIGNATURE");
    const paymentResponse = req.headers.get("PAYMENT-RESPONSE");

    if (!paymentSig) {
      // No payment — return 402
      const pr = buildPaymentRequired(resource, price);
      return new Response(pr.body, {
        status: pr.statusCode,
        headers: { ...pr.headers, ...corsHeaders },
      });
    }

    // In production: verify payment via facilitator
    // For now, accept and return resource
    try {
      const result = await handler();
      return Response.json(
        {
          ...result,
          payment: {
            verified: true,
            resource,
            amount: price,
            network: NETWORK,
          },
        },
        { headers: { ...corsHeaders, "PAYMENT-RESPONSE": paymentResponse || "" } }
      );
    } catch (err) {
      return Response.json(
        { error: "Internal error", details: String(err) },
        { status: 500, headers: corsHeaders }
      );
    }
  },
});
