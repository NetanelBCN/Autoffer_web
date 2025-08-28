import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, ShoppingCart, FolderOpen, UserRound, Settings, Contact, Briefcase, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCart } from "@/context/CartContext";
import CartDialog from "./CartDialog";
import { useState } from "react";
import { UserModel, websocketService } from "@/services/websocketService";
import { useNavigate } from "react-router-dom";

interface NavBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userData?: UserModel | null;
}

const NavBar = ({ activeSection, onSectionChange, userData }: NavBarProps) => {
  const navigate = useNavigate();
  
  const handleClick = (section: string, e: React.MouseEvent) => {
    e.preventDefault();
    onSectionChange(section);
  };

  const handleSignOut = () => {
    console.log('🔒 Starting sign out process...');
    
    // Clear user data from localStorage
    localStorage.removeItem('user');
    
    // Clear any other cached data if needed
    localStorage.clear();
    
    // Disconnect websocket service
    websocketService.disconnect();
    
    console.log('🔒 Data cleared, navigating to login...');
    
    // Navigate to login page and prevent going back
    navigate('/', { replace: true });
    
    // Force a hard navigation to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const getLinkClasses = (section: string) => {
    const baseClasses = "flex items-center space-x-2 text-gray-800 hover:text-gray-600";
    return activeSection === section ? `${baseClasses} font-bold` : baseClasses;
  };

  const { getTotalCount } = useCart();
  const [showCart, setShowCart] = useState(false);

  const handleImageError = () => {
    console.log("NavBar image failed to load");
  };

  const handleImageLoad = () => {
    console.log("NavBar image loaded successfully");
  };

  // Helper function to get user photo URL
  const getUserPhotoUrl = () => {
    if (userData?.photoBytes) {
      return `data:image/jpeg;base64,${userData.photoBytes}`;
    }
    return null;
  };

  // Cart badge above the user icon logic
  const cartTotal = getTotalCount();

  // User display name
  const userName = userData ? `${userData.firstName} ${userData.lastName}` : 'User';
  const userInitials = userData ? 
    `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}` : 
    'U';

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-2.5 fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <a href="#" onClick={(e) => handleClick("home", e)} className={getLinkClasses("home")}>
            <Home size={20} />
            <span>Home</span>
          </a>
          
          <a href="#" onClick={(e) => handleClick("shop", e)} className={getLinkClasses("shop")}>
            <ShoppingCart size={20} />
            <span>Shop</span>
          </a>
          
          <a href="#" onClick={(e) => handleClick("operations", e)} className={getLinkClasses("operations")}>
            <Briefcase size={20} />
            <span>Operations</span>
          </a>
          
          <a href="#" onClick={(e) => handleClick("projects", e)} className={getLinkClasses("projects")}>
            <FolderOpen size={20} />
            <span>My Projects</span>
          </a>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Cart icon with badge */}
          <button
            className="relative p-2 hover:bg-gray-100 rounded-full"
            onClick={() => setShowCart(true)}
            aria-label="Open cart"
          >
            <ShoppingCart size={22} />
            {cartTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white px-1 z-10">
                {cartTotal}
              </span>
            )}
          </button>
          <Popover>
            <PopoverTrigger className="flex items-center space-x-3 hover:opacity-80 relative">
              <span className="text-gray-800 cursor-pointer">{userName}</span>
              <Avatar>
                <AvatarImage 
                  src={getUserPhotoUrl() || undefined}
                  alt={userName}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                />
                <AvatarFallback className="bg-blue-500 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={(e) => handleClick("account", e)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <UserRound size={16} />
                  <span>My Account</span>
                </button>
                <button
                  onClick={(e) => handleClick("settings", e)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button
                  onClick={(e) => handleClick("contact", e)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Contact size={16} />
                  <span>Contact Us</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <CartDialog open={showCart} setOpen={setShowCart} />
    </nav>
  );
};

export default NavBar;