import { HiOutlineCog, HiOutlineHome } from "react-icons/hi2";
import { ReactNode } from "react";

import redditImg from "../../assets/reddit.png";

export type enumObject = {
  title: string;
  path: string;
  icon: ReactNode;
};

export type ConnectionObject = {
  name: string;
  connect: string;
  src: string;
  active: boolean;
  sources?: string[];
};

// eslint-disable-next-line react-refresh/only-export-components
export const navEnum: enumObject[] = [
  {
    title: "Discover",
    path: "/",
    icon: <HiOutlineHome />
  },
  // {
  //   title: "Search",
  //   path: "/search",
  //   icon: <HiOutlineMagnifyingGlass />
  // },
  // {
  //   title: "Favorites",
  //   path: "/favorites",
  //   icon: <HiOutlineHeart />
  // },
  // {
  //   title: "Collections",
  //   path: "/collections",
  //   icon: <HiOutlineRectangleGroup />
  // },
  {
    title: "Settings",
    path: "/settings",
    icon: <HiOutlineCog />
  }
];

export const ConnectionSettingsEnum: ConnectionObject[] = [
  {
    name: "Reddit",
    src: redditImg,
    connect: "start_reddit_auth_v2",
    active: false,
    sources: ["wallpapers", "wallpaper", "EarthPorn", "CityPorn"]
  }
];
