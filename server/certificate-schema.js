import { query, closePool } from './db.js';

async function runCertificateSchemaMigrations() {
  console.log('--- Applying Certificate & Correction Schema Migrations ---');

  try {
    // 1. Update applications.status ENUM to include 'CORRECTION_REQUIRED'
    console.log('1. Updating applications table schema...');
    try {
      await query(`
        ALTER TABLE applications 
        MODIFY COLUMN status ENUM('PENDING','UNDER_REVIEW','FORWARDED_TO_DEAN','APPROVED','REJECTED','ISSUED','CORRECTION_REQUIRED') 
        DEFAULT 'PENDING';
      `);
      console.log('✓ Added CORRECTION_REQUIRED to applications.status ENUM');
    } catch (e) {
      console.log('Status enum update notice:', e.message);
    }

    // Add correction_reason, edit_history, resubmitted_at to applications if not exists
    const [appCols] = await query('DESCRIBE applications;');
    const appFieldNames = appCols.map((c) => c.Field);

    if (!appFieldNames.includes('correction_reason')) {
      await query('ALTER TABLE applications ADD COLUMN correction_reason TEXT NULL;');
      console.log('✓ Added applications.correction_reason');
    }
    if (!appFieldNames.includes('edit_history')) {
      await query('ALTER TABLE applications ADD COLUMN edit_history JSON NULL;');
      console.log('✓ Added applications.edit_history');
    }
    if (!appFieldNames.includes('resubmitted_at')) {
      await query('ALTER TABLE applications ADD COLUMN resubmitted_at TIMESTAMP NULL;');
      console.log('✓ Added applications.resubmitted_at');
    }

    // 2. Update certificates table schema
    console.log('2. Updating certificates table schema...');
    const [certCols] = await query('DESCRIBE certificates;');
    const certFieldNames = certCols.map((c) => c.Field);

    if (!certFieldNames.includes('verification_token')) {
      await query('ALTER TABLE certificates ADD COLUMN verification_token VARCHAR(64) UNIQUE AFTER application_id;');
      console.log('✓ Added certificates.verification_token (UNIQUE)');
    }
    if (!certFieldNames.includes('token_hash')) {
      await query('ALTER TABLE certificates ADD COLUMN token_hash VARCHAR(64) NULL AFTER verification_token;');
      console.log('✓ Added certificates.token_hash');
    }
    if (!certFieldNames.includes('status')) {
      await query("ALTER TABLE certificates ADD COLUMN status ENUM('VALID','REVOKED') DEFAULT 'VALID' AFTER token_hash;");
      console.log('✓ Added certificates.status ENUM(VALID, REVOKED)');
    }
    if (!certFieldNames.includes('document_type_name')) {
      await query('ALTER TABLE certificates ADD COLUMN document_type_name VARCHAR(150) NULL;');
      console.log('✓ Added certificates.document_type_name');
    }
    if (!certFieldNames.includes('student_name')) {
      await query('ALTER TABLE certificates ADD COLUMN student_name VARCHAR(150) NULL;');
      console.log('✓ Added certificates.student_name');
    }
    if (!certFieldNames.includes('student_usn')) {
      await query('ALTER TABLE certificates ADD COLUMN student_usn VARCHAR(50) NULL;');
      console.log('✓ Added certificates.student_usn');
    }
    if (!certFieldNames.includes('institution_name')) {
      await query("ALTER TABLE certificates ADD COLUMN institution_name VARCHAR(150) DEFAULT 'CampusDocs Institutional Academy';");
      console.log('✓ Added certificates.institution_name');
    }
    if (!certFieldNames.includes('qr_code_data_url')) {
      await query('ALTER TABLE certificates ADD COLUMN qr_code_data_url LONGTEXT NULL;');
      console.log('✓ Added certificates.qr_code_data_url');
    }
    if (!certFieldNames.includes('revocation_reason')) {
      await query('ALTER TABLE certificates ADD COLUMN revocation_reason TEXT NULL;');
      console.log('✓ Added certificates.revocation_reason');
    }
    if (!certFieldNames.includes('revoked_at')) {
      await query('ALTER TABLE certificates ADD COLUMN revoked_at TIMESTAMP NULL;');
      console.log('✓ Added certificates.revoked_at');
    }
    if (!certFieldNames.includes('revoked_by')) {
      await query('ALTER TABLE certificates ADD COLUMN revoked_by BIGINT NULL;');
      console.log('✓ Added certificates.revoked_by');
    }

    console.log('\n--- All Schema Migrations Successfully Applied ---');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await closePool();
  }
}

runCertificateSchemaMigrations();
