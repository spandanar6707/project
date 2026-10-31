-- CampusDocs High-Performance Database Indexing & Integrity Script
-- Target: MySQL 8.0+ (campusdocs schema)

USE campusdocs;

-- 1. Applications Composite Indexes for High-Concurrency Lookups
-- Optimizes "My Applications" sorted by newest submission
CREATE INDEX IF NOT EXISTS idx_apps_student_date 
  ON applications (student_id, applied_at DESC);

-- Optimizes Admin Dashboard filtered by status and sorted by newest
CREATE INDEX IF NOT EXISTS idx_apps_status_date 
  ON applications (status, applied_at DESC);

-- Optimizes Document Type application analytics & foreign key joins
CREATE INDEX IF NOT EXISTS idx_apps_doc_type 
  ON applications (document_type_id, status);

-- Optimizes Bulk Request grouping queries
CREATE INDEX IF NOT EXISTS idx_apps_bulk_status 
  ON applications (bulk_request_id, status);

-- 2. Document Types Fast Active Lookup Index
CREATE INDEX IF NOT EXISTS idx_doc_types_active_name 
  ON document_types (is_active, document_name);

-- 3. Bulk Requests Student Lookup Index
CREATE INDEX IF NOT EXISTS idx_bulk_student_date 
  ON bulk_requests (student_id, created_at DESC);

-- 4. Approval History Lookup Index
CREATE INDEX IF NOT EXISTS idx_approval_app_date 
  ON approval_history (application_id, action_timestamp DESC);

-- Analyze tables to refresh optimizer statistics
ANALYZE TABLE applications;
ANALYZE TABLE document_types;
ANALYZE TABLE bulk_requests;
ANALYZE TABLE approval_history;
