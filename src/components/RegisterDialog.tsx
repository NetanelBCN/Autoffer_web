import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import { websocketService, RegisterUserRequest } from "@/services/websocketService";
import { useChat } from "@/context/ChatContext";
import { useNavigate } from "react-router-dom";

interface RegisterDialogProps {
  open: boolean;
  onClose: () => void;
}

const RegisterDialog = ({ open, onClose }: RegisterDialogProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initializeUserChats } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
    profileType: "FACTORY"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, profileType: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "First name is required",
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Last name is required",
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Phone number is required",
      });
      return false;
    }

    if (!formData.address.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Address is required",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const registerRequest: RegisterUserRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        profileType: formData.profileType
      };

      console.log('🎉 Starting registration process for email:', formData.email);
      
      // Step 1: Register the user
      console.log('🎉 Step 1: Calling websocketService.registerUser...');
      const user = await websocketService.registerUser(registerRequest);
      console.log('🎉 Step 1 Complete: User registered successfully:', user);
      console.log('🎉 User ID:', user.id);
      console.log('🎉 User Email:', user.email);
      console.log('🎉 User Profile Type:', user.profileType);
      
      // Step 2: Validate user data and profile type
      if (!user.id) {
        console.error('🎉 ERROR: No user ID received from server!');
        throw new Error('Invalid user data received from server');
      }
      
      // Check if user is a FACTORY type (same validation as login)
      if (user.profileType !== 'FACTORY') {
        console.error('🎉 ERROR: User is not a FACTORY type:', user.profileType);
        throw new Error('Registration successful, but access is limited to factory users only.');
      }
      
      // Step 3: Store user data in localStorage
      console.log('🎉 Step 2: Storing user data in localStorage...');
      localStorage.setItem('user', JSON.stringify(user));
      
      // Verify what was stored
      const storedUser = localStorage.getItem('user');
      console.log('🎉 Step 2 Verification: Stored user data:', storedUser);
      if (storedUser) {
        const parsedStoredUser = JSON.parse(storedUser);
        console.log('🎉 Step 2 Verification: Parsed user ID:', parsedStoredUser.id);
      }
      
      // Step 4: Initialize user chats with the confirmed user ID
      console.log('🎉 Step 3: Initializing chats for user ID:', user.id);
      await initializeUserChats(user.id);
      console.log('🎉 Step 3 Complete: Chats initialized successfully');
      
      // Step 5: Show success message and navigate
      toast({
        title: "Registration Successful!",
        description: `Welcome ${user.firstName}! You have been registered and logged in.`,
      });
      
      console.log('🎉 Step 4: Registration complete, navigating to /home...');
      onClose(); // Close the dialog first
      navigate('/home', { replace: true });
      console.log('🎉 Step 4 Complete: Navigation called successfully');
      
    } catch (error) {
      console.error('🎉 Registration error:', error);
      
      // Always reset loading state on error
      setIsLoading(false);
      
      // Show appropriate error message based on error type
      let errorMessage = "Registration failed. Please check your information and try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Registration successful, but access is limited to factory users only.')) {
          errorMessage = "Registration successful, but access is limited to factory users only.";
        } else if (error.message.includes('server may be unavailable')) {
          errorMessage = "Unable to connect to server. Please check your connection and try again.";
        } else if (error.message.includes('Failed to connect')) {
          errorMessage = "Connection failed. Please try again later.";
        } else if (error.message.includes('Invalid user data')) {
          errorMessage = "Server returned invalid data. Please try again.";
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
      return; // Don't reset loading state here since we already did it above
    }
    
    // Only reset loading state after successful completion
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      address: "",
      profileType: "FACTORY"
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Create Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                className="h-10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@factory.com"
              value={formData.email}
              onChange={handleChange}
              className="h-10"
              required
            />
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="123 Factory St, Industrial City, State 12345"
              value={formData.address}
              onChange={handleChange}
              className="h-10"
              required
            />
          </div>

          {/* Profile Type */}
          <div className="space-y-2">
            <Label htmlFor="profileType">Account Type *</Label>
            <Select onValueChange={handleProfileTypeChange} defaultValue="FACTORY">
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FACTORY">Factory</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button 
              type="submit" 
              className="w-full h-11 text-base bg-gray-800 hover:bg-gray-900 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} />
                  Create Account
                </span>
              )}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterDialog;