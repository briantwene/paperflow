import { HomeIcon } from "@heroicons/react/24/outline";
import {
  HiOutlineCog,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineMagnifyingGlass,
  HiOutlineRectangleGroup
} from "react-icons/hi2";
import { ReactNode } from "react";

export type enumObject = {
  title: string;
  path: string;
  icon: ReactNode;
};

export const navEnum: enumObject[] = [
  {
    title: "Discover",
    path: "/",
    icon: <HiOutlineHome />
  },
  {
    title: "Search",
    path: "/search",
    icon: <HiOutlineMagnifyingGlass />
  },
  {
    title: "Favorites",
    path: "/favorites",
    icon: <HiOutlineHeart />
  },
  {
    title: "Collections",
    path: "/collections",
    icon: <HiOutlineRectangleGroup />
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <HiOutlineCog />
  }
];
