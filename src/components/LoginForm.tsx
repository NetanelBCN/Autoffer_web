
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { websocketService, LoginRequest } from "@/services/websocketService";

const LoginForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

      console.log('About to call websocketService.loginUser');
      const user = await websocketService.loginUser(loginRequest);
      console.log('Login successful, user received:', user);
      
      localStorage.setItem('user', JSON.stringify(user));
      console.log('User data stored in localStorage');
      
      console.log('About to navigate to /home, current location:', location.pathname);
      console.log('Navigate function type:', typeof navigate);
      
      // Try immediate navigation
      navigate('/home', { replace: true });
      console.log('Navigate called');
      
      // Also try with a small delay to see if timing is the issue
      setTimeout(() => {
        console.log('Delayed navigation attempt, current location:', window.location.pathname);
        if (window.location.pathname !== '/home') {
          console.log('Navigation failed, trying again...');
          navigate('/home', { replace: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Login error caught:', error);
      
      // Always reset loading state on error
      setIsLoading(false);
      
      // Show appropriate error message based on error type
      let errorMessage = "The user details are incorrect. Please check your email and password and try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('server may be unavailable')) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else if (error.message.includes('Failed to connect')) {
          errorMessage = "Connection failed. Please try again later.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    }
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
          <p className="text-gray-500">Sign in to continue to Autoffer</p>
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
              <a href="#" className="font-medium text-gray-800 hover:underline">
                Contact sales
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;