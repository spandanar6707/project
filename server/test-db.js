import { testConnection } from './db.js';

async function main() {
  console.log('--- CampusDocs MySQL Connectivity Verification ---');
  const result = await testConnection();
  if (result.connected) {
    console.log('--- Connectivity Check Passed ---');
    process.exit(0);
  } else {
    console.error('--- Connectivity Check Failed ---');
    process.exit(1);
  }
}

main();
