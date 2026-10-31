/**
 * Delegation service deprecated in favor of native backend Role-Based Access Control (RBAC).
 *
 * Backend endpoints:
 * - POST /api/v1/auth/admin/login -> issues tokens with role: "admin"
 * - POST /api/v1/auth/login       -> issues tokens with role: "office_staff" / "student" / "faculty"
 * - POST /api/v1/docdesk/doc-types -> requires role: "office_staff" (Student Affairs)
 */

export const ensureStaffToken = async () => null;
export const clearStaffToken = () => {
  localStorage.removeItem('campusdocs_staff_token');
};
