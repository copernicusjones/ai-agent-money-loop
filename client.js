require('dotenv').config();
const { x402Client, wrapFetchWithPayment } = require('@x402/fetch');
const { registerExactSvmScheme } = require('@x402/svm/exact/client');
const { generateKeyPairSigner, createKeyPairSignerFromBytes } = require('@solana/kit');
const { base58 } = require('@scure/base');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const NETWORK = process.env.NETWORK || 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
const PAYER_SECRET = process.env.SOLANA_PRIVATE_KEY || '';

async function main() {
  let signer;
  if (PAYER_SECRET) {
    signer = await createKeyPairSignerFromBytes(base58.decode(PAYER_SECRET));
  } else {
    const ephemeral = await generateKeyPairSigner();
    signer = ephemeral;
    console.log('No SOLANA_PRIVATE_KEY set; using an ephemeral signer. This will only succeed if that wallet is funded.');
  }

  const client = new x402Client();
  registerExactSvmScheme(client, {
    signer,
    networks: [NETWORK],
  });

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const endpoints = [
    ['/v1/research', 'AI agents'],
    ['/v1/leads', 'lead generation'],
    ['/v1/content', 'money loops'],
  ];

  for (const [endpoint, topic] of endpoints) {
    const url = `${SERVER_URL}${endpoint}?${endpoint === '/v1/leads' ? 'query' : 'topic'}=${encodeURIComponent(topic)}`;
    console.log(`\n→ Requesting ${url}`);
    try {
      const response = await fetchWithPayment(url, { method: 'GET' });
      const body = await response.json();
      console.log(`HTTP ${response.status}`);
      console.log(JSON.stringify(body, null, 2));
    } catch (err) {
      console.error(`Failed calling ${endpoint}:`, err.message || err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
