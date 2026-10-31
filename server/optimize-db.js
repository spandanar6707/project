import pool from './db.js';

async function optimizeDatabase() {
  console.log('--- Applying Database Index Optimizations to campusdocs ---');
  const connection = await pool.getConnection();

  try {
    const indexesToAdd = [
      {
        table: 'applications',
        name: 'idx_apps_student_date',
        columns: '(student_id, applied_at DESC)',
        purpose: 'Optimizes Student "My Applications" sorted by newest',
      },
      {
        table: 'applications',
        name: 'idx_apps_status_date',
        columns: '(status, applied_at DESC)',
        purpose: 'Optimizes Admin Dashboard filtering by status and date',
      },
      {
        table: 'applications',
        name: 'idx_apps_doc_type',
        columns: '(document_type_id, status)',
        purpose: 'Optimizes document type joins and status counts',
      },
      {
        table: 'applications',
        name: 'idx_apps_bulk_status',
        columns: '(bulk_request_id, status)',
        purpose: 'Optimizes Bulk Batch aggregation queries',
      },
      {
        table: 'document_types',
        name: 'idx_doc_types_active_name',
        columns: '(is_active, document_name)',
        purpose: 'Optimizes Student Apply catalogue retrieval',
      },
      {
        table: 'bulk_requests',
        name: 'idx_bulk_student_date',
        columns: '(student_id, created_at DESC)',
        purpose: 'Optimizes Student Bulk Request history',
      },
      {
        table: 'approval_history',
        name: 'idx_approval_app_date',
        columns: '(application_id, action_date DESC)',
        purpose: 'Optimizes Application audit timeline',
      },
    ];

    for (const idx of indexesToAdd) {
      // Check if index already exists
      const [existing] = await connection.query(
        `SELECT COUNT(1) AS count FROM information_schema.statistics 
         WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
        [idx.table, idx.name]
      );

      if (existing[0].count > 0) {
        console.log(`✓ Index already present: ${idx.table}.${idx.name}`);
      } else {
        console.log(`+ Creating index: ${idx.table}.${idx.name} on ${idx.columns}...`);
        await connection.query(`ALTER TABLE ${idx.table} ADD INDEX ${idx.name} ${idx.columns};`);
        console.log(`  └─ Purpose: ${idx.purpose}`);
      }
    }

    // Refresh optimizer statistics
    console.log('Refreshing optimizer statistics...');
    await connection.query('ANALYZE TABLE applications, document_types, bulk_requests, approval_history;');
    console.log('✓ Optimizer statistics updated successfully.');

    console.log('--- Database Optimization Complete ---');
  } catch (error) {
    console.error('x Failed to optimize database:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

optimizeDatabase();
