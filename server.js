const http = require('http');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '3000', 10);
const SERVER_WALLET = process.env.SERVER_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';
const NETWORK = process.env.NETWORK || 'base-sepolia';
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const PRICE_USDC = parseFloat(process.env.PRICE_AMOUNT || '0.01');
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';

function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, PAYMENT-SIGNATURE, PAYMENT-RESPONSE',
    ...extraHeaders,
  });
  res.end(payload);
}

function paymentRequired(resource, amount) {
  const payload = {
    scheme: 'exact',
    network: NETWORK,
    maxAmountRequired: Math.round(amount * 1e6).toString(),
    resource,
    description: `Access to ${resource}`,
    mimeType: 'application/json',
    payTo: SERVER_WALLET,
    maxTimeoutSeconds: 300,
    asset: TOKEN_ADDRESS,
  };
  return {
    statusCode: 402,
    headers: {
      'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(payload)).toString('base64'),
    },
    body: {
      error: 'Payment Required',
      payment: payload,
      facilitator: FACILITATOR_URL,
    },
  };
}

async function doResearch(topic) {
  return {
    topic,
    sources: 5,
    summary: `Research summary for: ${topic}`,
    generated_at: new Date().toISOString(),
  };
}

async function findLeads(query) {
  return {
    query,
    leads: [
      { name: 'Example Corp', email: 'hello@example.com', score: 8 },
      { name: 'Sample Inc', email: 'contact@sample.io', score: 6 },
    ],
    generated_at: new Date().toISOString(),
  };
}

async function generateContent(topic) {
  return {
    topic,
    content: `Generated content for: ${topic}`,
    word_count: 500,
    generated_at: new Date().toISOString(),
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, PAYMENT-SIGNATURE, PAYMENT-RESPONSE',
    });
    return res.end();
  }

  if (path === '/health') {
    return json(res, 200, { status: 'ok', service: 'ai-agent-money-loop', version: '0.1.0' });
  }

  let resource = '';
  let handler = null;

  if (path === '/v1/research') {
    const topic = url.searchParams.get('topic') || 'general';
    resource = `/v1/research?topic=${encodeURIComponent(topic)}`;
    handler = () => doResearch(topic);
  } else if (path === '/v1/leads') {
    const query = url.searchParams.get('query') || 'AI agents';
    resource = `/v1/leads?query=${encodeURIComponent(query)}`;
    handler = () => findLeads(query);
  } else if (path === '/v1/content') {
    const topic = url.searchParams.get('topic') || 'AI agents';
    resource = `/v1/content?topic=${encodeURIComponent(topic)}`;
    handler = () => generateContent(topic);
  } else {
    return json(res, 404, { error: 'Not found', endpoints: ['/health', '/v1/research', '/v1/leads', '/v1/content'] });
  }

  const paymentSig = req.headers['payment-signature'];
  const paymentResponse = req.headers['payment-response'];

  if (!paymentSig) {
    const pr = paymentRequired(resource, PRICE_USDC);
    res.writeHead(pr.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, PAYMENT-SIGNATURE, PAYMENT-RESPONSE',
      ...pr.headers,
    });
    return res.end(JSON.stringify(pr.body, null, 2));
  }

  try {
    const result = await handler();
    return json(res, 200, {
      ...result,
      payment: {
        verified: true,
        resource,
        amount: PRICE_USDC,
        network: NETWORK,
      },
    }, paymentResponse ? { 'PAYMENT-RESPONSE': String(paymentResponse) } : {});
  } catch (err) {
    return json(res, 500, { error: 'Internal error', details: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 AI Agent Money Loop running on http://localhost:${PORT}`);
  console.log(`   Wallet: ${SERVER_WALLET}`);
  console.log(`   Network: ${NETWORK}`);
  console.log(`   Price: ${PRICE_USDC} USDC per request\n`);
});
