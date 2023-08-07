import { ImageInfo } from "../utils/models";

type Props = {
  image: ImageInfo;
};

const InfoPanel = ({ image }: Props) => {
  const infoMap = Object.keys(image || {}).map((item) => (
    <div className="flex-1">
      <p className="font-light capitalize text-slate-400 ">{item}</p>
      <p>{image[item as keyof ImageInfo]}</p>
    </div>
  ));

  return (
    <div className="my-4 rounded-md">
      <p className="mb-4 text-xl font-bold">Info</p>
      <div className="flex"> {infoMap}</div>
    </div>
  );
};

export default InfoPanel;
