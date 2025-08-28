import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserModel } from '@/services/websocketService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isFactoryUser, setIsFactoryUser] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Force a fresh check each time the location changes
        console.log('🔒 Checking authentication for route:', location.pathname);
        
        const storedUser = localStorage.getItem('user');
        
        if (!storedUser || storedUser === 'null' || storedUser === 'undefined') {
          console.log('🔒 No valid user data found in localStorage');
          localStorage.removeItem('user'); // Clean up invalid data
          setIsAuthenticated(false);
          setIsFactoryUser(false);
          return;
        }

        const user: UserModel = JSON.parse(storedUser);
        
        if (!user || !user.id || typeof user.id !== 'string') {
          console.log('🔒 Invalid user data - no valid user ID');
          localStorage.removeItem('user'); // Clean up invalid data
          setIsAuthenticated(false);
          setIsFactoryUser(false);
          return;
        }

        if (user.profileType !== 'FACTORY') {
          console.log('🔒 User is not a FACTORY type:', user.profileType);
          localStorage.removeItem('user'); // Clean up non-factory user
          setIsAuthenticated(false);
          setIsFactoryUser(false);
          return;
        }

        console.log('🔒 User authenticated successfully:', user.email);
        setIsAuthenticated(true);
        setIsFactoryUser(true);
        
      } catch (error) {
        console.error('🔒 Error checking authentication:', error);
        localStorage.removeItem('user'); // Clean up corrupted data
        setIsAuthenticated(false);
        setIsFactoryUser(false);
      }
    };

    checkAuth();
    
    // Also check on storage events (in case user data changes in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        console.log('🔒 User data changed in another tab, rechecking auth');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname]); // Re-run when route changes

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated or not a factory user
  if (!isAuthenticated || !isFactoryUser) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;