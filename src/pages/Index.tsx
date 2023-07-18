import { invoke } from "@tauri-apps/api/tauri";

const Index = () => {
  return (
    <div>
      <button
        // onClick={() =>
        //   invoke("fetch", { subreddit: "wallpaper", sort: "top" }).then(
        //     (data) => console.log(data)
        //   )
        // }
        onClick={() =>
          invoke("view_img", { id: "152w2o4", redditor: "Neko_Swag" }).then(
            (data) => console.log(data)
          )
        }
      >
        try command
      </button>
    </div>
  );
};

export default Index;
