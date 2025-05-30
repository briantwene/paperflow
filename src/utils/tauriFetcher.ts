import { invoke } from "@tauri-apps/api/core";

import { Image, ImageView } from "./models";

//fetcher function to use with useSWR
export const fetcher = async (
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<ImageView | Image[]> => {
  //use invoke function
  const data: Image[] | ImageView = await invoke(key, params);

  return data;
};
