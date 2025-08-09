// components/ColorPalette.tsx
import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";
import { extractColorsFromImage, type ColorInfo } from "@/lib/colorExtraction";

interface ColorPaletteProps {
  imageUrl: string;
  imageTitle: string;
}

export const ColorPalette = ({ imageUrl, imageTitle }: ColorPaletteProps) => {
  const [colors, setColors] = useState<ColorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const extractColors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const extractedColors = await extractColorsFromImage(imageUrl);
      setColors(extractedColors);
    } catch (error) {
      console.error("Color extraction failed:", error);
      setError("Unable to extract colors from this image");
      setColors([]); // Clear any previous colors
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl]);

  useEffect(() => {
    extractColors();
  }, [extractColors]);

  const copyToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      console.error("Failed to copy color:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-12 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Color Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Some images may not be accessible due to CORS restrictions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Color Palette</CardTitle>
        <p className="text-sm text-muted-foreground">
          Extracted from {imageTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color, index) => (
            <div
              key={index}
              className="relative transition-transform rounded cursor-pointer group aspect-square hover:scale-105"
              style={{ backgroundColor: color.hex }}
              onClick={() => copyToClipboard(color.hex)}
              title={`${color.hex} (${color.percentage}%)`}
            >
              <div className="absolute inset-0 flex items-center justify-center transition-colors rounded bg-black/0 group-hover:bg-black/20">
                {copiedColor === color.hex ? (
                  <Check className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                ) : (
                  <Copy className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {colors.slice(0, 3).map((color, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border rounded"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="font-mono">{color.hex}</span>
              </div>
              <span className="text-muted-foreground">{color.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
