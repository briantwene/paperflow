import { useState, useEffect } from "react";
import { Home, Settings as SettingsIcon, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

// Import the SVG assets
import paperflowDarkMain from "@/assets/paperflowDarkMain.svg";
import paperflowLightMain from "@/assets/paperflowLightMain.svg";

// type NavigateFunctions = {
//   home: () => void;
//   preview: () => void;
//   settings: () => void;
// };

// type MainLayoutProps = {
//   children: React.ReactNode;
//   navigate: NavigateFunctions;
//   currentRoute: string;
// };

export function MainLayout() {
  const { theme } = useTheme();
  const navigate = useNavigate();
   const currentRoute = useLocation({
    select: (location) => location.pathname,
  })
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // Check if scrolled for header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-full min-h-screen overflow-x-hidden bg-background">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-200 border-b",
          isScrolled
            ? "backdrop-blur-md bg-background/80 border-border"
            : "bg-transparent border-transparent"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 mx-auto sm:px-6 lg:px-8 max-w-screen-2xl">
          <div className="flex items-center gap-2">
            {currentRoute === "view" && (
              <Button
                variant="ghost"
                size="icon"
                 onClick={() => navigate({to: "/"})}
                className="mr-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <div
              className="relative cursor-pointer group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
              onClick={() => navigate({to: "/"})}
            >
              <img 
                src={theme === 'dark' ? paperflowDarkMain : paperflowLightMain} 
                alt="Paper Flow" 
                className={cn(
                  "h-8 transition-all duration-300",
                  isLogoHovered && "scale-105"
                )}
              />
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-300",
                isLogoHovered ? [
                  theme === 'dark' ? "bg-primary/10" : "bg-primary/5",
                  "blur-xl"
                ] : "blur-none"
              )} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={currentRoute === "home" ? "secondary" : "ghost"}
              size="icon"
               onClick={() => navigate({to: "/"})}
            >
              <Home className="w-4 h-4" />
              <span className="sr-only">Home</span>
            </Button>
            <Button
              variant={currentRoute === "settings" ? "secondary" : "ghost"}
              size="icon"
               onClick={() => navigate({to: "/settings"})}
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full mt-16">
        <div className="px-4 py-6 mx-auto sm:px-6 lg:px-8 max-w-screen-2xl">
          <div className="duration-300 ease-in-out animate-in slide-in-from-bottom-4">
            <Outlet />
          </div>
        </div>
      </main>
      {import.meta.env.MODE !== "production" && <TanStackRouterDevtools />}
    </div>
  );
}