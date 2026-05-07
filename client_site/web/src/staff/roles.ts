import type { User } from '../context/AuthContext';

export function isStaffUser(user: User | null | undefined) {
  if (!user) return false;
  return user.roles.includes('admin') || user.roles.includes('associate');
}

export function isAdminUser(user: User | null | undefined) {
  return !!user?.roles.includes('admin');
}
