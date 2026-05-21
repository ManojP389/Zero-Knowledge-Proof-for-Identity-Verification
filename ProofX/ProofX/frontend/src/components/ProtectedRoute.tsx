import { Navigate, Outlet } from 'react-router-dom';
import { AuthRole, getRole, getToken } from '../api';

interface ProtectedRouteProps {
  role: AuthRole;
}

export default function ProtectedRoute({ role }: ProtectedRouteProps) {
  const token = getToken();
  const currentRole = getRole();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (currentRole !== role) {
    return <Navigate to={currentRole === 'company' ? '/company/requirements' : '/user/upload'} replace />;
  }

  return <Outlet />;
}
