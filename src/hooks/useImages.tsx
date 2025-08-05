import useSWR from "swr";
import { fetcher } from "../utils/tauriFetcher";
import { Image } from "../utils/models";
const useImages = (subreddit: string, sort: string) => {
  const params = { subreddit, sort };
  const { data, error, isLoading } = useSWR(
    ["fetch", params],
    ([url, params]) => fetcher(url, params)
  );
  console.log(data);
  return {
    images: data as Image[],
    error,
    isLoading
  };
};

export default useImages;
