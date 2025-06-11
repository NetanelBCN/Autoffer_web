import { TrendingUp, LineChart, Bot, Scan } from "lucide-react";

const LoginBanner = () => {
  return (
    <div className="relative h-full overflow-hidden  bg-[#252525]">
      <div className="absolute inset-0 bg-pattern opacity-5"></div>
      
      <div className="relative h-full flex flex-col justify-center items-center p-8 z-10">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">R.N.D.Y</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="h-0.5 w-10 bg-white/50"></div>
            <span className="text-lg font-light text-white/90">Aluminum Solutions</span>
            <div className="h-0.5 w-10 bg-white/50"></div>
          </div>
        </div>
        
        <div className="mb-8 max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-center text-white">Autoffer</h2>
          <p className="text-xl text-center mb-6 text-gray-300">
            Revolutionizing price management in aluminum
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="bg-white/10 p-3 rounded-full">
                <TrendingUp size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white">Real-time Price Optimization</h3>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-sm p-4 rounded-lg shadow-md">
              <div className="bg-white/10 p-3 rounded-full">
                <LineChart size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-medium text-white">Competitive Analysis</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 w-full max-w-md"> {/* Reduced top margin from mt-4 to mt-2 */}
          <h3 className="text-xl font-bold mb-4 text-center text-white">AI-Powered Solutions</h3>
          <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <div className="flex items-start gap-3">
                <Scan className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                <p className="text-gray-300">Our AI technology scans aluminum documents and specifications.</p>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-white mt-1 flex-shrink-0" />
                <p className="text-gray-300">Intelligent spatial analysis for warehouse optimization.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-4 text-center w-full"> {/* Adjusted bottom positioning from bottom-6 to bottom-4 */}
          <p className="text-gray-400 text-sm">© 2025 R.N.D.Y Aluminum Solutions</p>
        </div>
        
        {/* Add decorative elements */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-5 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
      </div>
    </div>
  );
};

export default LoginBanner;