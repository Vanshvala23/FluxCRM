import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // ✅ Don't render anything until localStorage is checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center animate-pulse">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Loading FluxCRM...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}