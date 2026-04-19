import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function RequireRole({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="page-loading">Loading…</p>;
  }
  if (!user || !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
