import { useState, useEffect } from "react";
import { WallpaperCard } from "./WallpaperCard";
import { cn } from "@/lib/utils";
import { Wallpaper } from "@/types";

type WallpaperGridProps = {
  wallpapers: Wallpaper[];
};

export function WallpaperGrid({ wallpapers }: WallpaperGridProps) {
  const [columns, setColumns] = useState(4);

  // Responsive column adjustment based on viewport width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 768) {
        setColumns(2);
      } else if (width < 1024) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If no wallpapers, show empty state
  if (wallpapers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] space-y-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          No Wallpapers Found
        </h2>
        <p className="max-w-md text-muted-foreground">
          Try selecting a different source or checking your connection settings.
        </p>
      </div>
    );
  }

  // Create a masonry-like layout with responsive columns
  const createGrid = () => {
    const grid = Array.from({ length: columns }, () => [] as Wallpaper[]);

    // Distribute wallpapers across columns
    wallpapers.forEach((wallpaper, index) => {
      const columnIndex = index % columns;
      grid[columnIndex].push(wallpaper);
    });

    return grid;
  };

  const grid = createGrid();

  return (
    <div
      className={cn("grid gap-4", {
        "grid-cols-1": columns === 1,
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4
      })}
    >
      {grid.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {column.map((wallpaper) => (
            <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} />
          ))}
        </div>
      ))}
    </div>
  );
}
