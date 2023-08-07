import useSWR from "swr";
import { fetcher } from "../utils/tauriFetcher";
import { Image } from "../utils/models";
const useImages = (subreddit: string, sort: string) => {
  const { data, error, isLoading } = useSWR(
    ["fetch", { subreddit, sort }],
    fetcher
  );
  console.log(data);
  return {
    images: data as Image[],
    error,
    isLoading
  };
};

export default useImages;
