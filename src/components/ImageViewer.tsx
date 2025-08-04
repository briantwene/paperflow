import { ImageView } from "@/utils/models";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { Minimize2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";

export interface ImageViewerProps {
  selectedWallpaper: ImageView;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  zoom: number;

  isImageLoading: boolean;
  // setIsImageLoading: (loading: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
}

export const ImageViewer = ({
  selectedWallpaper,
  isFullscreen,
  setIsFullscreen,
  zoom,
  isImageLoading,
  // setIsImageLoading,
  handleZoomIn,
  handleZoomOut
}: ImageViewerProps) => {
  return (
    <div
      className={cn(
        "relative group max-w-full overflow-hidden",
        isFullscreen
          ? "fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
          : "max-h-[70vh] bg-black/5 dark:bg-white/5 rounded-lg"
      )}
    >
      {isImageLoading && (
        <Skeleton
          className={cn(
            "absolute inset-0 rounded-lg",
            !isFullscreen && "max-h-[70vh]"
          )}
        />
      )}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg max-w-full",
          isFullscreen
            ? "w-full h-full flex items-center justify-center"
            : "flex items-center justify-center"
        )}
      >
        <img
          src={selectedWallpaper.url}
          alt={selectedWallpaper.title}
          className={cn(
            "max-w-full max-h-full object-contain transition-all duration-300",
            isImageLoading ? "opacity-0" : "opacity-100",
            !isFullscreen && "max-h-[70vh]"
          )}
          style={{ transform: `scale(${zoom})` }}
          // onLoad={() => setIsImageLoading(false)}
        />
      </div>

      <div
        className={cn(
          "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isFullscreen && "opacity-100"
        )}
      >
        <div className="flex items-center gap-2 p-2 rounded-lg shadow-lg bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {isFullscreen && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
