import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { websocketService, LoginRequest } from "@/services/websocketService";
import { useChat } from "@/context/ChatContext";
import RegisterDialog from "./RegisterDialog";

const LoginForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeUserChats } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Debug current location changes
  useEffect(() => {
    console.log('Current location changed to:', location.pathname);
  }, [location.pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    if (!formData.email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const loginRequest: LoginRequest = {
        email: formData.email,
        password: formData.password,
      };

      console.log('🔥 Starting login process for email:', formData.email);
      
      // Step 1: Login and get user data
      console.log('🔥 Step 1: Calling websocketService.loginUser...');
      const user = await websocketService.loginUser(loginRequest);
      console.log('🔥 Step 1 Complete: User data received:', user);
      console.log('🔥 User ID:', user.id);
      console.log('🔥 User Email:', user.email);
      console.log('🔥 User Profile Type:', user.profileType);
      
      // Step 2: Validate user data and profile type
      if (!user.id) {
        console.error('🔥 ERROR: No user ID received from server!');
        throw new Error('Invalid user data received from server');
      }
      
      // Check if user is a FACTORY type
      if (user.profileType !== 'FACTORY') {
        console.error('🔥 ERROR: User is not a FACTORY type:', user.profileType);
        throw new Error('Access denied. This application is for factory users only.');
      }
      
      // Step 3: Store user data in localStorage
      console.log('🔥 Step 2: Storing user data in localStorage...');
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify what was stored
      const storedUser = localStorage.getItem('user');
      console.log('🔥 Step 2 Verification: Stored user data:', storedUser);
      if (storedUser) {
        const parsedStoredUser = JSON.parse(storedUser);
        console.log('🔥 Step 2 Verification: Parsed user ID:', parsedStoredUser.id);
      }
      
      // Step 4: Initialize user chats with the confirmed user ID
      console.log('🔥 Step 3: Initializing chats for user ID:', user.id);
      await initializeUserChats(user.id);
      console.log('🔥 Step 3 Complete: Chats initialized successfully');
      
      // Step 5: Navigate to home page only after everything is complete
      console.log('🔥 Step 4: All initialization complete, navigating to /home...');
      console.log('🔥 Current location before navigation:', location.pathname);
      navigate('/home', { replace: true });
      console.log('🔥 Step 4 Complete: Navigation called successfully');
      
    } catch (error) {
      console.error('🔥 Login error:', error);
      
      // Always reset loading state on error
      setIsLoading(false);
      
      // Show appropriate error message based on error type
      let errorMessage = "The user details are incorrect. Please check your email and password and try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Access denied. This application is for factory users only.')) {
          errorMessage = "Access denied. This application is for factory users only.";
        } else if (error.message.includes('server may be unavailable')) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else if (error.message.includes('Failed to connect')) {
          errorMessage = "Connection failed. Please try again later.";
        } else if (error.message.includes('Invalid user data')) {
          errorMessage = "Server returned invalid data. Please try again.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
      return; // Don't reset loading state here since we already did it above
    }
    
    // Only reset loading state after successful completion
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col justify-center px-8 md:px-12 lg:px-16 xl:px-20 relative overflow-hidden">
      {/* Animated waves at the bottom */}
      <div className="wave-container">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-500">Sign in to continue to Autoffer Factory Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a 
                href="#" 
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot?
              </a>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="h-11 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-base bg-gray-800 hover:bg-gray-900 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2 text-white">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent"></span>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-white">
                <LogIn size={18} />
                Sign in
              </span>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <button 
                type="button"
                onClick={() => setShowRegisterDialog(true)}
                className="font-medium text-gray-800 hover:underline focus:outline-none"
              >
                Register here
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Registration Dialog */}
      <RegisterDialog 
        open={showRegisterDialog} 
        onClose={() => setShowRegisterDialog(false)} 
      />
    </div>
  );
};

export default LoginForm;
