import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { isStaffUser } from '../staff/roles';

export function RequireStaffAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return <p className="page-loading">Loading…</p>;
  }
  if (!user) {
    return <Navigate to="/staff/login" state={{ from: loc.pathname }} replace />;
  }
  if (!isStaffUser(user)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
