import 'dotenv/config';
import { Client } from 'basic-ftp';

async function tryConnect(label, options) {
  const client = new Client();
  client.ftp.verbose = false;
  console.log(`\nTesting: ${label}`);
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      ...options,
    });
    console.log(`✓ SUCCESS`);
    const list = await client.list('/');
    console.log('Root dirs:', list.filter(f => f.type === 2).map(f => f.name).join(', '));
    client.close();
    return true;
  } catch (err) {
    console.log(`✗ FAILED: ${err.message}`);
    client.close();
    return false;
  }
}

console.log('Host:', process.env.FTP_HOST);
console.log('User:', process.env.FTP_USER);

// Try in order of preference
const result =
  await tryConnect('Explicit FTPS (TLS, rejectUnauthorized=false)', { secure: true, secureOptions: { rejectUnauthorized: false } }) ||
  await tryConnect('Plain FTP (no TLS)', { secure: false }) ||
  await tryConnect('Implicit FTPS (port 990)', { secure: 'implicit', port: 990, secureOptions: { rejectUnauthorized: false } });

if (!result) {
  console.log('\nAll connection methods failed. Please verify credentials in cPanel FTP Accounts.');
}
