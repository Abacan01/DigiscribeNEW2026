import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function getDefaultRoute(role) {
  return role === 'admin' ? '/admin/dashboard' : '/dashboard';
}

export default function HomeRoute({ children }) {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
          <p className="text-sm text-gray-text mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return children;
}