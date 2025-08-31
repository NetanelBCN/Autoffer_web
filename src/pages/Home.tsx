import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";
import Catalog from "@/components/Catalog";
import Operations from "@/components/Operations";
import MyAccount from "@/components/MyAccount";
import MyProjects from "@/components/MyProjects";
import SubscriptionAds from "@/components/SubscriptionAds";
import AluminumProjectShowcase from "@/components/AluminumProjectShowcase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { CartProvider } from "@/context/CartContext";
import { UserModel } from "@/services/websocketService";

// Placeholder supplier images
const suppliers = [
  {
    name: "AluCo Industries",
    logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "Tubex Metals",
    logo: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "FramePro Supplies",
    logo: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "FlexAlum Partners",
    logo: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=400&q=80"
  },
  {
    name: "BuildMetals Group",
    logo: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=400&q=80"
  }
];

// Logo for "All" suppliers (using a placeholder image)
const allLogo = "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=120&q=80";

const Home = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState<UserModel | null>(null);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: UserModel = JSON.parse(storedUser);
        setUserData(parsedUser);
        console.log('Loaded user data from localStorage:', parsedUser);
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
      }
    }
    
  }, []);

  const handleNavigateToProjects = () => {
    setActiveSection("projects");
  };

  const handleUserDataUpdated = (updatedUser: UserModel) => {
    setUserData(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('User data updated:', updatedUser);
  };

  const handleImageError = () => {
    console.log("Image failed to load");
  };

  const handleImageLoad = () => {
    console.log("Image loaded successfully");
  };

  // Helper function to get user photo URL
  const getUserPhotoUrl = () => {
    if (userData?.photoBytes) {
      return `data:image/jpeg;base64,${userData.photoBytes}`;
    }
    return null;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      // Handle the format "08-06-2025 13:10:05"
      const [datePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Autoffer Dashboard{userData ? `, ${userData.firstName}` : ''} 👋
              </h1>
              <p className="text-xl text-gray-600">Your aluminum solutions platform</p>
            </div>
            <AluminumProjectShowcase onNavigateToProjects={handleNavigateToProjects} />
            <SubscriptionAds />
          </div>
        );
      case "account":
        return <MyAccount userData={userData} onUserDataUpdated={handleUserDataUpdated} />;
      case "shop":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Shop Aluminum Products</h1>
            
            {/* Search bar */}
            <div className="relative mb-6">
              <div className="flex items-center border rounded-md px-3 py-2 bg-white">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <Input 
                  type="text" 
                  placeholder="Search for products..." 
                  className="border-0 focus-visible:ring-0 p-0 shadow-none text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="mb-8">
              <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                  {/* "All" option */}
                  <CarouselItem className="basis-1/3 md:basis-1/6 lg:basis-1/6">
                    <div
                      className={`flex flex-col items-center cursor-pointer transition duration-200 transform p-2 ${
                        selectedSupplier === null
                          ? "brightness-110 scale-105 opacity-100"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        zIndex: selectedSupplier === null ? 2 : 1,
                        boxShadow: selectedSupplier === null ? "0 4px 16px 0 rgba(0,0,0,0.08)" : "none"
                      }}
                      onClick={() => setSelectedSupplier(null)}
                    >
                      <div className="w-20 h-20 overflow-visible rounded-full mb-1 transition-all">
                        <img
                          src={allLogo}
                          alt="All Suppliers"
                          className={`w-full h-full object-cover border-2 border-gray-200 shadow rounded-full transition-all`}
                          style={{
                            filter: selectedSupplier === null ? "none" : "grayscale(20%)",
                            opacity: selectedSupplier === null ? 1 : 0.58
                          }}
                        />
                      </div>
                      <span className="mt-2 text-xs font-medium text-gray-600 text-center w-full truncate">
                        All
                      </span>
                    </div>
                  </CarouselItem>
                  {/* supplier logos */}
                  {suppliers.map((supplier, idx) => (
                    <CarouselItem key={supplier.name + idx} className="basis-1/3 md:basis-1/6 lg:basis-1/6">
                      <div
                        className={`flex flex-col items-center cursor-pointer transition duration-200 transform p-2 ${
                          selectedSupplier === supplier.name
                            ? "brightness-110 scale-105 opacity-100"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          zIndex: selectedSupplier === supplier.name ? 2 : 1,
                          boxShadow: selectedSupplier === supplier.name ? "0 4px 16px 0 rgba(0,0,0,0.08)" : "none"
                        }}
                        onClick={() => setSelectedSupplier(supplier.name)}
                      >
                        <div className="w-20 h-20 overflow-visible rounded-full mb-1 transition-all">
                          <img
                            src={supplier.logo}
                            alt={supplier.name}
                            className={`w-full h-full object-cover border-2 border-gray-200 shadow rounded-full transition-all`}
                            style={{
                              filter: selectedSupplier === supplier.name ? "none" : "grayscale(20%)",
                              opacity: selectedSupplier === supplier.name ? 1 : 0.58
                            }}
                          />
                        </div>
                        <span className="mt-2 text-xs font-medium text-gray-600 text-center w-full truncate">
                          {supplier.name}
                        </span>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
            <Catalog selectedSupplier={selectedSupplier} searchTerm={searchTerm} />
          </div>
        );
      case "operations":
        return <Operations userData={userData} />;
      case "projects":
        return <MyProjects userData={userData} />;
      default:
        return (
          <div className="space-y-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Autoffer Dashboard{userData ? `, ${userData.firstName}` : ''} 👋
              </h1>
              <p className="text-xl text-gray-600">Your aluminum solutions platform</p>
            </div>
            <AluminumProjectShowcase onNavigateToProjects={handleNavigateToProjects} />
            <SubscriptionAds />
          </div>
        );
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <NavBar activeSection={activeSection} onSectionChange={setActiveSection} userData={userData} />
        <main className="pt-20 px-4">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </CartProvider>
  );
};

export default Home;