import { invoke } from "@tauri-apps/api/core";

import { Wallpaper, ImageView } from "./models";

//fetcher function to use with useSWR
export const fetcher = async (
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<ImageView | Wallpaper[]> => {
  //use invoke function
  const data: Wallpaper[] | ImageView = await invoke(key, params);

  return data;
};
