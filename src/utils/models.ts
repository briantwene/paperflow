// Re-export the unified Wallpaper interface from types
export type { Wallpaper } from "../types/index";
import type { Wallpaper } from "../types/index";

// Keep Image as an alias for backward compatibility during transition
export interface Image {
  id: string;
  url: string;
  title: string;
  author: string;
  width?: number;
  height?: number;
  subreddit?: string;
}

export interface ImageView {
  url: string;
  title: string;
  author: string;
  karma: number;
  subreddit: string;
  created: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  images: Wallpaper[];
  // Add any other properties related to a collection
}

export interface LikedPictures {
  images: Wallpaper[];
  // Add any other properties related to liked pictures
}

export interface UserSettings {
  username: string;
  // Add any other properties related to user settings
}
