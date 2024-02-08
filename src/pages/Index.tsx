import { Link } from "@tanstack/react-router";
import Filter from "../components/Filter";

import useImages from "../hooks/useImages";


const Index = () => {
  const { images, error, isLoading } = useImages("wallpaper", "top");

  if (isLoading) {
    return <div>Loading</div>;
  } else if (error) {
    return <div>{error}</div>;
  } else {
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
            <Link
              to="/view/$id"
              params={{
                id: image.id
              }}
            >
              <img className="w-full h-auto mb-4" src={image?.url} alt="" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // return <div>Ha</div>;

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
