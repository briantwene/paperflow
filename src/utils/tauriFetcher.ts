import { invoke } from "@tauri-apps/api/tauri";
import { Fetcher } from "swr";
import { Image, ImageInfo } from "./models";

//fetcher function to use with useSWR
export const fetcher: Fetcher<Image[] | ImageInfo, string> = async (
  args
): Promise<ImageInfo | Image[]> => {
  console.log(args);
  const [key, params] = args;
  //use invoke function
  const data: Image[] | ImageInfo = await invoke(key, params);

  return data;
};
