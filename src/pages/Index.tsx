import LoginForm from "@/components/LoginForm";
import LoginBanner from "@/components/LoginBanner";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

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