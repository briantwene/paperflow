// lib/colorExtraction.ts

export interface ColorInfo {
  hex: string;
  rgb: string;
  hsl: string;
  percentage: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Extracts dominant colors from an image URL
 * @param imageUrl - URL of the image to analyze
 * @param maxColors - Maximum number of colors to return (default: 8)
 * @param maxSize - Maximum size for image processing (default: 200px)
 * @returns Promise resolving to array of ColorInfo objects
 */
export const extractColorsFromImage = async (
  imageUrl: string,
  maxColors = 8,
  maxSize = 200
): Promise<ColorInfo[]> => {
  return new Promise((resolve, reject) => {
    // Create canvas and load image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Resize for performance (max size)
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Extract color data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const extractedColors = processImageColors(imageData, maxColors);
        resolve(extractedColors);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Processes ImageData to extract dominant colors
 * @param imageData - Canvas ImageData object
 * @param maxColors - Maximum number of colors to return
 * @returns Array of ColorInfo objects sorted by dominance
 */
const processImageColors = (imageData: ImageData, maxColors: number): ColorInfo[] => {
  const colorMap = new Map<string, number>();
  const data = imageData.data;
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors (reduce to 16 levels per channel)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;
    
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  
  // Convert to array and sort by frequency
  const sortedColors = Array.from(colorMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxColors);
  
  const totalPixels = sortedColors.reduce((sum, [, count]) => sum + count, 0);
  
  return sortedColors.map(([rgb, count]) => {
    const [r, g, b] = rgb.split(',').map(Number);
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    
    return {
      hex,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      percentage: Math.round((count / totalPixels) * 100)
    };
  });
};

/**
 * Converts RGB values to hexadecimal color string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hexadecimal color string (e.g., "#ff0000")
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Converts RGB values to HSL color space
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 */
export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255; 
  g /= 255; 
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: 
        h = (g - b) / d + (g < b ? 6 : 0); 
        break;
      case g: 
        h = (b - r) / d + 2; 
        break;
      case b: 
        h = (r - g) / d + 4; 
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

/**
 * Utility function to get the most dominant color from an image
 * @param imageUrl - URL of the image to analyze
 * @returns Promise resolving to the most dominant ColorInfo object
 */
export const getDominantColor = async (imageUrl: string): Promise<ColorInfo | null> => {
  try {
    const colors = await extractColorsFromImage(imageUrl, 1);
    return colors[0] || null;
  } catch (error) {
    console.error('Failed to extract dominant color:', error);
    return null;
  }
};

/**
 * Utility function to check if a color is considered "dark"
 * @param hex - Hexadecimal color string
 * @returns Boolean indicating if the color is dark
 */
export const isColorDark = (hex: string): boolean => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};
