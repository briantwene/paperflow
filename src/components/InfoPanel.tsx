import { invoke } from "@tauri-apps/api";
import { ImageView } from "../utils/models";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "./ui/card";

type Props = {
  image: ImageView;
};

const InfoPanel = ({ image }: Props) => {
  const infoMap = Object.keys(image || {}).map((item) => (
    <div className="flex-1 my-2">
      <p className="font-light capitalize text-slate-400 ">{item}</p>
      <p>{image[item as keyof ImageView]}</p>
    </div>
  ));

  const download = async () => {
    const result = await invoke("reddit_download", {
      info: {
        url: image.url,
        name: image.title
      }
    });
    console.log("download result", result);
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex-col">{infoMap}</div>
      </CardContent>
      <CardFooter>
        <Button onClick={download}>Download</Button>
      </CardFooter>
    </Card>
  );

  // return (
  //   <div className="my-4 rounded-md">
  //     <p className="mb-4 text-xl font-bold">Info</p>
  //     <div className="flex-col"> {infoMap}</div>
  //   </div>
  // );
};

export default InfoPanel;


