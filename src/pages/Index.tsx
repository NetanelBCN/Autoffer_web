import LoginForm from "@/components/LoginForm";
import LoginBanner from "@/components/LoginBanner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserModel } from "@/services/websocketService";

const Index = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkExistingAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
          const user: UserModel = JSON.parse(storedUser);
          
          // If valid factory user exists, redirect to home
          if (user.id && user.profileType === 'FACTORY') {
            console.log('🔒 User already authenticated, redirecting to home');
            navigate('/home', { replace: true });
          }
        }
      } catch (error) {
        console.error('🔒 Error checking existing authentication:', error);
        // Clear invalid data
        localStorage.removeItem('user');
      }
    };

    checkExistingAuth();
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Show LoginForm always */}
      <div className="w-full md:w-1/2 h-full">
        <LoginForm />
      </div>
      {/* Only show LoginBanner on desktop */}
      {!isMobile && (
        <div className="w-full md:w-1/2 h-full">
          <LoginBanner />
        </div>
      )}
    </div>
  );
};

export default Index;