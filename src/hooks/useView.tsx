import useSWR from "swr";
import { fetcher } from "../utils/tauriFetcher";
import { ImageView } from "../utils/models";

const useView = (id: string | undefined) => {
  const params = { id };
  const { data, error, isLoading } = useSWR(
    ["view_img", params],
    ([key, params]) => fetcher(key, params)
  );
  console.log(data);
  return {
    image: data as ImageView,
    error,
    isLoading
  };
};

export default useView;
