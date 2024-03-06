export interface Image {
  id: string;
  url: string;
  title: string;
  author: string;
  // Add any other properties related to an image
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
  images: Image[];
  // Add any other properties related to a collection
}

export interface LikedPictures {
  images: Image[];
  // Add any other properties related to liked pictures
}

export interface UserSettings {
  username: string;
  // Add any other properties related to user settings
}
