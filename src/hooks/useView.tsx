import useSWR from "swr";
import { fetcher } from "../utils/tauriFetcher";
import { ImageInfo } from "../utils/models";

const useView = (id: string | undefined) => {
  const { data, error, isLoading } = useSWR(["view_img", { id }], fetcher);
  console.log(data);
  return {
    image: data as ImageInfo,
    error,
    isLoading
  };
};

export default useView;
