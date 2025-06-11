import React from "react";

const WaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-gray-100">
      <div className="absolute inset-0 flex flex-col justify-end overflow-hidden">
        {/* First Wave */}
        <div 
          className="wave-animation w-[200%] h-24 md:h-32 lg:h-40 bg-gray-200 opacity-50"
          style={{
            borderRadius: "40%",
            position: "absolute",
            bottom: "26%",
          }}
        />
        
        {/* Second Wave */}
        <div 
          className="wave-animation-slow w-[200%] h-32 md:h-40 lg:h-48 bg-gray-300 opacity-60"
          style={{
            borderRadius: "40%",
            position: "absolute",
            bottom: "18%",
          }}
        />
        
        {/* Third Wave */}
        <div 
          className="wave-animation-slower w-[200%] h-40 md:h-48 lg:h-56 bg-gray-400 opacity-70"
          style={{
            borderRadius: "40%",
            position: "absolute",
            bottom: "10%",
          }}
        />
        
        {/* Fourth Wave - Bottom */}
        <div 
          className="w-full h-32 md:h-40 lg:h-48 bg-gray-500"
          style={{
            position: "absolute",
            bottom: 0,
          }}
        />
      </div>
    </div>
  );
};

export default WaveBackground;