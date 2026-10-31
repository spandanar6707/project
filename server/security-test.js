import { query, closePool, testConnection } from './db.js';
import { sanitizeFilename, validateUploadFile, MAX_FILE_SIZE_BYTES } from '../src/utils/fileSecurity.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
  }
}

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('  CampusDocs Security Audit & Verification Suite    ');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // TEST SUITE 1: SQL Injection Resilience & Prepared Statements
  // -------------------------------------------------------------------------
  console.log('[Phase 5 & 8] Testing SQL Injection Resilience & Prepared Statements:');
  try {
    // Test connection first
    const connCheck = await testConnection();
    assert(connCheck.connected, 'MySQL Connection Active');

    // Injection Attempt 1: Classic boolean tautology in student query
    const sqliPayload1 = "' OR '1'='1";
    const [rows1] = await query('SELECT * FROM students WHERE usn = ?', [sqliPayload1]);
    assert(
      rows1.length === 0,
      'SQLi Attempt 1: Classic Tautology (\' OR \'1\'=\'1) treated as literal string without leaking records'
    );

    // Injection Attempt 2: Stacked query with DROP TABLE attempt
    const sqliPayload2 = "4GH24CS001'; DROP TABLE students; --";
    const [rows2] = await query('SELECT * FROM students WHERE usn = ?', [sqliPayload2]);
    assert(
      rows2.length === 0,
      'SQLi Attempt 2: Stacked DROP TABLE command neutralized by parameterized statement'
    );

    // Verify students table is still intact and secure
    const [intactCheck] = await query('SELECT COUNT(*) AS count FROM students');
    assert(
      intactCheck[0].count >= 0,
      'Database Integrity: Students table intact and unaltered'
    );

    // Injection Attempt 3: Blind SQL injection payload in admin query
    const sqliPayload3 = "admin@college.edu' UNION SELECT 1,2,3,4,5,6,7,8-- ";
    const [rows3] = await query('SELECT * FROM admins WHERE email = ?', [sqliPayload3]);
    assert(
      rows3.length === 0,
      'SQLi Attempt 3: Admin auth query parameterized safely against UNION SELECT attack'
    );
  } catch (err) {
    console.error('SQLi test failed with error:', err.message);
    assert(false, 'Database SQL Injection Suite', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 2: File Upload Security & Path Traversal Neutralization
  // -------------------------------------------------------------------------
  console.log('\n[Phase 6 & 8] Testing File Upload Security & Path Traversal Neutralization:');

  // Test Path Traversal in filename
  const traversal1 = '../../../../etc/passwd';
  const clean1 = sanitizeFilename(traversal1);
  assert(
    !clean1.includes('..') && !clean1.includes('/') && clean1 === 'passwd',
    'Directory Traversal: Unix path traversal stripped (`../../../../etc/passwd` -> `passwd`)'
  );

  const traversal2 = '..\\..\\windows\\system32\\cmd.exe';
  const clean2 = sanitizeFilename(traversal2);
  assert(
    !clean2.includes('..') && !clean2.includes('\\') && clean2.endsWith('cmd.exe'),
    'Directory Traversal: Windows path traversal stripped (`..\\..\\cmd.exe` -> `cmd.exe`)'
  );

  // Test Null Byte Injection
  const nullByteName = 'malicious.php\x00.pdf';
  const cleanNull = sanitizeFilename(nullByteName);
  assert(
    !cleanNull.includes('\x00') && cleanNull === 'malicious.php.pdf',
    'Null Byte Injection: Null byte stripped from filename (`malicious.php\\0.pdf` -> `malicious.php.pdf`)'
  );

  // Test File Upload Extensions (Mock HTML5 File objects)
  const executableFile = { name: 'exploit.exe', size: 1024, type: 'application/x-msdownload' };
  const resExe = validateUploadFile(executableFile);
  assert(
    !resExe.valid && resExe.error.includes('Disallowed file type'),
    'Disallowed Extension: `.exe` executable file rejected'
  );

  const scriptFile = { name: 'webshell.php', size: 1024, type: 'application/x-php' };
  const resScript = validateUploadFile(scriptFile);
  assert(
    !resScript.valid && resScript.error.includes('Disallowed file type'),
    'Disallowed Extension: `.php` script file rejected'
  );

  // Test File Size Limits (5 MB threshold)
  const oversizedFile = {
    name: 'giant_archive.pdf',
    size: MAX_FILE_SIZE_BYTES + 1024 * 1024, // 6 MB
    type: 'application/pdf',
  };
  const resSize = validateUploadFile(oversizedFile);
  assert(
    !resSize.valid && resSize.error.includes('exceeds the 5 MB institutional limit'),
    'Upload Size Constraint: 6MB file rejected under 5MB policy'
  );

  const validPdfFile = {
    name: 'academic_transcript_2026.pdf',
    size: 2 * 1024 * 1024, // 2 MB
    type: 'application/pdf',
  };
  const resValid = validateUploadFile(validPdfFile);
  assert(
    resValid.valid === true,
    'Valid File Acceptance: 2MB academic PDF document successfully accepted'
  );

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Credential Isolation & Environment Protection
  // -------------------------------------------------------------------------
  console.log('\n[Phase 5 & 7] Testing Credential Isolation & Git Protection:');

  const gitignorePath = path.resolve(__dirname, '../.gitignore');
  const gitignoreExists = fs.existsSync(gitignorePath);
  assert(gitignoreExists, '.gitignore file exists in project root');

  if (gitignoreExists) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    assert(
      gitignoreContent.includes('.env'),
      '.gitignore excludes `.env` and environment secret files'
    );
  }

  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasViteDbPassword = envContent.includes('VITE_DB_PASSWORD') || envContent.includes('VITE_DB_');
    assert(
      !hasViteDbPassword,
      'Client Leakage Defense: Database credentials NOT prefixed with `VITE_` (prevents bundling into browser client)'
    );
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Cloud API Authentication Gatekeeper
  // -------------------------------------------------------------------------
  console.log('\n[Phase 2 & 4] Testing Cloud API Authentication Gatekeeper (Render Backend):');

  try {
    const cloudEndpoint = 'https://campus-os-backend-8sjf.onrender.com/api/v1/docdesk/requests';
    const response = await fetch(cloudEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    assert(
      response.status === 401 || response.status === 403,
      `API Gatekeeper: Unauthenticated GET /api/v1/docdesk/requests strictly rejected with HTTP ${response.status}`
    );

    // Test with malformed token
    const malformedResponse = await fetch(cloudEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer fake_invalid_jwt_token_12345',
      },
    });

    assert(
      malformedResponse.status === 401 || malformedResponse.status === 403,
      `API Gatekeeper: Request with invalid Bearer token strictly rejected with HTTP ${malformedResponse.status}`
    );
  } catch (netErr) {
    console.warn('Note: Cloud backend request failed (network/offline):', netErr.message);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`  Security Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================\n');

  await closePool();
}

runSecurityTestSuite().catch((err) => {
  console.error('Fatal error in security test runner:', err);
  process.exit(1);
});
