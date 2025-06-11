import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Award, Building, Home, Factory } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "Modern Office Complex",
    description: "Sleek aluminum curtain wall system with energy-efficient glazing",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80",
    type: "Commercial",
    icon: Building,
    stats: { panels: "2,400", sqft: "15,000", timeline: "8 months" }
  },
  {
    id: 2,
    title: "Luxury Residential Tower",
    description: "Premium aluminum windows and balcony railings with custom finishes",
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=800&q=80",
    type: "Residential",
    icon: Home,
    stats: { units: "120", floors: "25", budget: "$2.8M" }
  },
  {
    id: 3,
    title: "Industrial Warehouse",
    description: "Large-scale aluminum structural framework with enhanced durability",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&q=80",
    type: "Industrial",
    icon: Factory,
    stats: { beams: "800", sqft: "50,000", load: "2000 tons" }
  },
  {
    id: 4,
    title: "Award-Winning Museum",
    description: "Artistic aluminum facade with integrated LED lighting system",
    image: "https://images.unsplash.com/photo-1433832597046-4f10e10ac764?auto=format&fit=crop&w=800&q=80",
    type: "Cultural",
    icon: Award,
    stats: { awards: "3", visitors: "500K/year", panels: "1,200" }
  }
];

interface AluminumProjectShowcaseProps {
  onNavigateToProjects?: () => void;
}

const AluminumProjectShowcase = ({ onNavigateToProjects }: AluminumProjectShowcaseProps) => {
  const [currentProject, setCurrentProject] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentProject((prev) => (prev + 1) % projects.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextProject = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentProject((prev) => (prev + 1) % projects.length);
        setIsAnimating(false);
      }, 300);
    }
  };

  const project = projects[currentProject];
  const IconComponent = project.icon;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Featured Aluminum Projects
        </h2>
        <p className="text-gray-600">
          Discover innovative aluminum solutions across various industries
        </p>
      </div>

      {/* Main Featured Project */}
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-500">
        <div className="relative">
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="relative h-80 overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Project Type Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2">
                  <IconComponent className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-700">{project.type}</span>
                </div>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white rounded-full w-16 h-16 p-0"
                  onClick={nextProject}
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>

              {/* Project Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
                <p className="text-gray-200 mb-4">{project.description}</p>
                
                {/* Stats */}
                <div className="flex space-x-6 text-sm">
                  {Object.entries(project.stats).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="font-bold text-lg">{value}</div>
                      <div className="text-gray-300 capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projects.map((proj, index) => (
          <Card
            key={proj.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              index === currentProject ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'hover:scale-102'
            }`}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentProject(index);
                  setIsAnimating(false);
                }, 300);
              }
            }}
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={proj.image}
                alt={proj.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute bottom-2 left-2 right-2">
                <h4 className="text-white font-medium text-sm truncate">{proj.title}</h4>
                <p className="text-gray-200 text-xs">{proj.type}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2"
          onClick={onNavigateToProjects}
        >
          <ExternalLink className="h-4 w-4" />
          <span>View All Projects</span>
        </Button>
        <Button className="bg-black text-white hover:bg-gray-800 flex items-center space-x-2">
          <span>Start Your Project</span>
        </Button>
      </div>
    </div>
  );
};

export default AluminumProjectShowcase;