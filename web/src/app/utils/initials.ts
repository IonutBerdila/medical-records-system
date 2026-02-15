/**
 * Returns initials from name (first + last), email, or id.
 * Same logic as in DoctorPatientsPage for consistent display.
 */
export function getInitials(fullName?: string, email?: string, id?: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  if (id) return id.slice(0, 2).toUpperCase();
  return '?';
}
