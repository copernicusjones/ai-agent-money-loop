require('dotenv').config();
const express = require('express');
const { paymentMiddleware, x402ResourceServer } = require('@x402/express');
const { HTTPFacilitatorClient } = require('@x402/core/server');
const { registerExactSvmScheme } = require('@x402/svm/exact/server');

const PORT = Number(process.env.PORT || 3000);
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';
const NETWORK = process.env.NETWORK || 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const PAY_TO = process.env.SOLANA_RECEIVE_ADDRESS || '8HzxVpJC2uFEBYJfGrgLgR8zyNG3xBJmXF3DtVuUnuXQ';
const PRICE = process.env.PRICE_AMOUNT || '$0.001';

const app = express();
app.use(express.json());

const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitator);
registerExactSvmScheme(resourceServer);

const routes = {
  'GET /v1/research': {
    accepts: [
      {
        scheme: 'exact',
        price: PRICE,
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description: 'Generate a concise research summary on a topic',
    mimeType: 'application/json',
  },
  'GET /v1/leads': {
    accepts: [
      {
        scheme: 'exact',
        price: PRICE,
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description: 'Return a small lead list for a search query',
    mimeType: 'application/json',
  },
  'GET /v1/content': {
    accepts: [
      {
        scheme: 'exact',
        price: PRICE,
        network: NETWORK,
        payTo: PAY_TO,
      },
    ],
    description: 'Generate draft content for a topic',
    mimeType: 'application/json',
  },
};

app.use(paymentMiddleware(routes, resourceServer));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-agent-money-loop',
    version: '0.2.0',
    x402: true,
    network: NETWORK,
    facilitator: FACILITATOR_URL,
    payTo: PAY_TO,
  });
});

app.get('/v1/research', (req, res) => {
  const topic = String(req.query.topic || 'general');
  res.json({
    topic,
    sources: 5,
    summary: `Research summary for: ${topic}`,
    generated_at: new Date().toISOString(),
    monetization: 'x402 exact payment',
  });
});

app.get('/v1/leads', (req, res) => {
  const query = String(req.query.query || 'AI agents');
  res.json({
    query,
    leads: [
      { name: 'Example Corp', email: 'hello@example.com', score: 8 },
      { name: 'Sample Inc', email: 'contact@sample.io', score: 6 },
    ],
    generated_at: new Date().toISOString(),
    monetization: 'x402 exact payment',
  });
});

app.get('/v1/content', (req, res) => {
  const topic = String(req.query.topic || 'AI agents');
  res.json({
    topic,
    content: `Generated content for: ${topic}`,
    word_count: 500,
    generated_at: new Date().toISOString(),
    monetization: 'x402 exact payment',
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AI Agent Money Loop running on http://localhost:${PORT}`);
  console.log(`   x402 facilitator: ${FACILITATOR_URL}`);
  console.log(`   network: ${NETWORK}`);
  console.log(`   payTo: ${PAY_TO}`);
  console.log(`   price: ${PRICE}\n`);
});
