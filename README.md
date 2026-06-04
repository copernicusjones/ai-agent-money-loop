# AI Agent Money Loop

A self-hosted, x402-ready monetization starter for autonomous AI agents.

## What this is

A working template for an agent that:
1. Exposes a useful API or tool (research, lead-finding, content generation, etc.)
2. Charges for access via **x402** (HTTP 402 pay-per-request, no accounts needed)
3. Runs fully autonomously after one-time setup
4. Can be registered in agent marketplaces and directories

## Architecture

```
Client (human or agent)
    |
    v
[ HTTP request ] --> [ x402 middleware ] --> [ payment required: 402 ]
    |                                           |
    v                                           v
[ resource returned ] <-- [ payment verified via facilitator ]
```

## Quick Start

### 1. Prerequisites

```bash
# Install Bun (for TypeScript) or use Node with fetch
curl -fsSL https://bun.sh/install | bash

# Get a wallet for the server (receiving payments)
# You can also run your own facilitator or use Coinbase's free tier
```

### 2. Environment

```bash
cp .env.example .env
# Fill in:
#   SERVER_WALLET_ADDRESS=0xYourWallet
#   NETWORK=base-sepolia   # for testing
#   TOKEN_ADDRESS=0x...    # USDC contract on chosen network
#   PRICE_AMOUNT=0.01       # USDC per request
#   FACILITATOR_URL=https://x402.org/facilitator
```

### 3. Run

```bash
bun install
bun run server.ts
```

### 4. Test without payment (localhost)

```bash
curl http://localhost:3000/health

# Test the paid endpoint
curl http://localhost:3000/v1/research?topic=AI+agents
# Returns 402 with payment instructions if no payment provided
```

### 5. Run with x402 client

```bash
bun run example-client.ts "AI agents 2026"
```

## Revenue Per Request Model

| Tier | Price | Use |
|------|-------|-----|
| Free | 0 | Limited / demo |
| Research | 0.01 USDC | Single query |
| Report | 0.05 USDC | Multi-source report |
| API Access | 0.001 USDC | Per-call for other agents |

## Marketplace Registration

Once running, register here:
- https://www.deepnlp.org/workspace/my_ai_services
- https://nevermined.app/
- https://agentvine.com/

## Security

- No API keys stored for buyers
- Server validates all payments on-chain
- Rate limiting via middleware
- All state in git / local SQLite, no remote deps
