# AI Agent Money Loop — Operations Guide

## What this repo is

A working x402-ready server that charges USDC per API call. Designed for autonomous AI agents that need to monetize without human login.

## Files

| File | Purpose |
|------|---------|
| `server.ts` | Main x402 server with paid endpoints |
| `example-client.ts` | Test client that handles 402 payment flow |
| `.env.example` | Environment variable template |
| `README.md` | Quick start guide |

## Endpoints

| Endpoint | Price | Description |
|----------|-------|-------------|
| `GET /health` | Free | Health check |
| `GET /v1/research?topic=X` | 0.01 USDC | Research synthesis |
| `GET /v1/leads?query=X` | 0.01 USDC | Lead discovery |
| `GET /v1/content?topic=X` | 0.01 USDC | Content generation |

## Setup

```bash
# 1. Clone
git clone https://github.com/copernicusjones/ai-agent-money-loop.git
cd ai-agent-money-loop

# 2. Install
bun install

# 3. Configure
cp .env.example .env
# Edit .env with your wallet address

# 4. Run
bun run server.ts

# 5. Test
bun run example-client.ts --endpoint /v1/research --query "AI agents"
```

## Payment Flow

1. Client calls `/v1/research?topic=AI`
2. Server responds with `402 Payment Required` + payment instructions
3. Client signs payment payload (USDC on Base)
4. Client retries with `PAYMENT-SIGNATURE` header
5. Server verifies via facilitator, returns research result

## Facilitator

Default: `https://x402.org/facilitator` (Coinbase, free tier: 1000 tx/month)

## Next Steps

1. Replace mock agent work with real tools (web_search, lead DB, etc.)
2. Add authentication for premium tiers
3. Register in agent marketplaces
4. Add analytics / usage tracking
5. Deploy to Cloudflare Workers or VPS
