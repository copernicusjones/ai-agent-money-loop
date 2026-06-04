const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

const argv = process.argv.slice(2);
const endpoint = argv.includes('--endpoint') ? argv[argv.indexOf('--endpoint') + 1] : '/v1/research';
const query = argv.includes('--query') ? argv[argv.indexOf('--query') + 1] : 'AI agents 2026';
const shouldPay = argv.includes('--pay');

async function main() {
  const url = `${SERVER_URL}${endpoint}?topic=${encodeURIComponent(query)}`;
  console.log(`\n🔍 Calling: ${url}`);

  const res1 = await fetch(url);
  if (res1.status === 402) {
    const body = await res1.json();
    console.log(`\n💳 Payment required: ${body.payment?.maxAmountRequired || '?'} units`);
    console.log(`   Resource: ${body.payment?.resource}`);
    console.log(`   Network: ${body.payment?.network}`);
    if (!shouldPay) {
      console.log('\n⚠️  Skipping payment (use --pay to simulate payment)');
      console.log(JSON.stringify(body, null, 2));
      return;
    }
    const res2 = await fetch(url, { headers: { 'PAYMENT-SIGNATURE': 'simulated-signature' } });
    const body2 = await res2.json();
    console.log('\n✅ Response after simulated payment:');
    console.log(JSON.stringify(body2, null, 2));
    return;
  }

  const body = await res1.json();
  console.log('\n✅ Response:');
  console.log(JSON.stringify(body, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
