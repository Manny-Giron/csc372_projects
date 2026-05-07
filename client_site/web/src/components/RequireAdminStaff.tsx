import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function RequireAdminStaff({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="page-loading">Loading…</p>;
  }
  if (!user?.roles.includes('admin')) {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return <>{children}</>;
}
