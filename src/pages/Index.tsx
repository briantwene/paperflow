import { invoke } from "@tauri-apps/api/tauri";

const Index = () => {
  return (
    <div>
      <button
        onClick={() =>
          invoke("fetch", { subreddit: "wallpaper", sort: "top" }).then(
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
