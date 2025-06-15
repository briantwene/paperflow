import { useParams } from "@tanstack/react-router";
import useView from "../hooks/useView";

import InfoPanel from "../components/InfoPanel";

const View = () => {
  const id = useParams({
    from: "/view/$id",
    select: (params) => params.id
  });
  const { image, isLoading, error } = useView(id);

  if (isLoading) {
    return <div>Loading</div>;
  } else if (error) {
    return <div>{error}</div>;
  } else {
    return (
      <div className="grid grid-cols-1 gap-4 m-4 grid-rows-viewLayout lg:grid-cols-8">
        <div className="my-4 lg:col-span-8">
          <h1 className="text-3xl font-medium">{image?.title}</h1>
        </div>
        <div className="lg:col-span-6">
          <img className="rounded-md" src={image?.url} />
        </div>
        <InfoPanel image={image} />
      </div>
    );
  }
};

export default View;
