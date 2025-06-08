import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallpaper } from "@/types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type WallpaperCardProps = {
  wallpaper: Wallpaper;
};

export function WallpaperCard({ wallpaper }: WallpaperCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate aspect ratio with fallback values to avoid undefined
  const aspectRatio = (wallpaper.width ?? 16) / (wallpaper.height ?? 9);
  
  return (

     <Link
                to="/view/$id"
                params={{
                  id: wallpaper.id
                }}>
    <div 
      className={cn(
        "group overflow-hidden rounded-lg transition-all duration-300 cursor-pointer transform",
        isHovered ? "ring-2 ring-primary shadow-lg scale-[1.01]" : "ring-1 ring-border/50 shadow-sm"
      )}

      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AspectRatio ratio={aspectRatio}>
        {isLoading && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <img
          src={wallpaper.url}
          alt={wallpaper.title}
          className={cn(
            "object-cover w-full h-full transition-all duration-700",
            isLoading ? "opacity-0" : "opacity-100",
            isHovered ? "scale-105" : "scale-100"
          )}
          onLoad={() => setIsLoading(false)}
        />
        <div className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <p className="text-sm font-medium text-white truncate">{wallpaper.title}</p>
          <p className="text-xs truncate text-white/80">r/{wallpaper.subreddit} · u/{wallpaper.author}</p>
        </div>
      </AspectRatio>
    </div>
    </Link>
  );
}