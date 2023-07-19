import { invoke } from "@tauri-apps/api/tauri";
import { useState, useEffect } from "react";
import Filter from "../components/Filter";

const Index = () => {
  const [images, setImages] = useState<object[] | null>(null);

  const fetchImages = async () => {
    const data: object[] = await invoke("fetch", {
      subreddit: "wallpaper",
      sort: "top"
    });
    data.shift();
    setImages(data);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  console.log(images);
  return (
    <div className="w-full px-6">
      <div className="flex items-center h-48">
        <h1 className="text-5xl font-semibold">Discover</h1>
      </div>
      <div className="">
        <h1 className="flex items-center h-16 text-2xl font-semibold">
          Filters
        </h1>
        <Filter />
      </div>

      <div className="gap-4 mb-6 columns-1 sm:columns-2 lg:columns-3 ">
        {images?.map((image) => (
          <img className="w-full h-auto mb-4" src={image?.url} alt="" />
        ))}
      </div>
    </div>
  );
  // return (
  //   <div className="w-full">
  //     {/* <h1 className="m-6 text-5xl font-semibold">Discover</h1> */}
  //     <button
  //       // onClick={() =>
  //       //   invoke("fetch", { subreddit: "wallpaper", sort: "top" }).then(
  //       //     (data) => console.log(data)
  //       //   )
  //       // }
  //       onClick={() =>
  //         invoke("view_img", { id: "152w2o4", redditor: "Neko_Swag" }).then(
  //           (data) => console.log(data)
  //         )
  //       }
  //     >
  //       some button
  //     </button>
  //   </div>
  // );
};

export default Index;
