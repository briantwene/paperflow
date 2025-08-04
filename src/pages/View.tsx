import { useParams } from "@tanstack/react-router";
import useView from "../hooks/useView";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  Download,
  Link,
  Loader2,
  Tag,
  User
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { ImageViewer } from "@/components/ImageViewer";
import { ImageView } from "@/utils/models";
import { invoke } from "@tauri-apps/api/core";

const View = () => {
  const id = useParams({
    from: "/view/$id",
    select: (params) => params.id
  });
  const { image, isLoading, error } = useView(id);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadWallpaper = async (image: ImageView) => {
    const result = await invoke("reddit_download", {
      info: {
        url: image.url,
        name: image.title
      }
    });
    console.log("download result", result);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadWallpaper(image);
    setIsDownloading(false);
  };

  useEffect(() => {
    setZoom(1);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        setZoom(1);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isFullscreen]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const formattedDate = (created: string) =>
    format(new Date(created), "MMMM d, yyyy");

  if (isLoading) {
    return (
      <div>
        Loading
        <Loader2 className="inline-block w-6 h-6 ml-2 animate-spin" />
      </div>
    );
  } else if (error) {
    return <div>{error}</div>;
  } else {
    return (
      <div className="max-w-full space-y-6 overflow-x-hidden">
        <ImageViewer
          selectedWallpaper={image}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          zoom={zoom}
          isImageLoading={isLoading}
          // setIsImageLoading={isLoading}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
        />

        <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-6 max-w-full">
          <Card className="max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl break-words">
                {image.title}
              </CardTitle>
              <CardDescription>
                {image.width} x {image.height}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div className="flex flex-wrap gap-2">
              {image.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div> */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center min-w-0 gap-2">
                  <User className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">
                    Posted by u/{image.author}
                  </span>
                </div>
                <div className="flex items-center min-w-0 gap-2">
                  <Calendar className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">
                    {formattedDate(image.created)}
                  </span>
                </div>
                <div className="flex items-center min-w-0 gap-2">
                  <Link className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-sm truncate hover:underline"
                  >
                    Original Post
                    <ArrowUpRight className="flex-shrink-0 w-3 h-3 ml-1" />
                  </a>
                </div>
                <div className="flex items-center min-w-0 gap-2">
                  <Tag className="flex-shrink-0 w-4 h-4 text-muted-foreground" />
                  <span className="text-sm truncate">r/{image.subreddit}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Wallpaper
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
};

export default View;
