import { useParams } from "@tanstack/router";
import useView from "../hooks/useView";
import Button from "../components/common/Button";
import InfoPanel from "../components/InfoPanel";

const View = () => {
  const { id } = useParams();
  const { image, isLoading, error } = useView(id);

  if (isLoading) {
    return <div>Loading</div>;
  } else {
    return (
      <div className="flex flex-col w-full h-full px-8 ">
        <div className="flex items-center justify-between my-4">
          <h1 className="text-2xl font-medium">{image?.title}</h1>
          <div className="flex justify-end gap-4 mt-3">
            <Button text="Collect" />
            <Button text="Like" />
            <Button text="Download" />
          </div>
        </div>
        <div className="self-center img-container">
          <img className="rounded-md" src={image?.url} />
        </div>
        <InfoPanel image={image?.info} />
      </div>
    );
  }
};

export default View;
