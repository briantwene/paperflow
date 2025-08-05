import { useNavigate } from "@tanstack/react-router";

import useImages from "../hooks/useImages";
import { useConnectionStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WallpaperGrid } from "@/wallpapers/WallpaperGrid";

const Index = () => {
  const { wallpapers, error, isLoading } = useImages("wallpaper", "top");
  const isAuthenticated = useConnectionStore((state) => state.isAuthenticated);
  const navigator = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          Connect to Get Started
        </h2>
        <p className="max-w-md text-muted-foreground">
          Connect to a wallpaper provider in the settings to start browsing
          wallpapers.
        </p>
        <Button onClick={() => navigator({ to: "/settings" })}>
          Go to Settings
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading wallpapers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-destructive">
          Error Loading Wallpapers
        </h2>
        <p className="max-w-md text-muted-foreground">{error}</p>
        {/* <Button onClick={() => fetchWallpapers()}>Try Again</Button> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Wallpapers</h1>

        {/* <div className="flex flex-wrap gap-2">
          {allSources.map(({ source }) => (
            <Button
              key={source}
              variant={selectedSource === source ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedSource(source)}
              className="text-sm"
            >
              r/{source}
            </Button>
          ))}
        </div> */}
      </div>
      <WallpaperGrid wallpapers={wallpapers} />
    </div>
  );

  // return <div>Ha</div>;

  // return (
  //   <div className="w-full">
  //     {/* <h1 className="m-6 text-5xl font-semibold">Discover</h1> */}
  //     <button
  //       // onClick={() =>
  //       //   invoke("fetch", { subreddit: "wallpaper", sort: "top" }).then(
  //       //     (data) => console.log(data)
  //       //   )
  //       // }
  //       onClick={() =>
  //         invoke("view_img", { id: "152w2o4", redditor: "Neko_Swag" }).then(
  //           (data) => console.log(data)
  //         )
  //       }
  //     >
  //       some button
  //     </button>
  //   </div>
  // );
};

export default Index;
