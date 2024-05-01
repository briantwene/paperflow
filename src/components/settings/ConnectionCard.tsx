import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Button } from "../ui/button";
import { ConnectionObject } from "../enums";
import { invoke } from "@tauri-apps/api";
import { Check } from "lucide-react";

const ConnectionCard = ({ name, src, connect, active }: ConnectionObject) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonDisplay = () => {
    // if the card is hovered, show the button
    // if the card is hovered and active, just show the name OR show the button

    // if active then show the connect and disable
    // if not active show connect and activate

    return (
      <div className="relative flex items-center justify-center h-10">
        <Button
          className={`w-28 transition-all duration-200 ease-in-out absolute bg-transparent ${
            isHovered && active ? "bg-green-500 text-white" : ""
          } ${isHovered ? "opacity-100 visible" : "opacity-0 invisible"}`}
          disabled={active}
          onClick={() => invoke(connect)}
        >
          {active ? <Check /> : "Connect"}
        </Button>
        <CardTitle
          className={`text-xl font-bold text-center transition-all duration-200 ease-in-out absolute ${
            isHovered ? "opacity-0 invisible" : "opacity-100 visible"
          }`}
        >
          {name}
        </CardTitle>
      </div>
    );
  };
  console.log(active);
  return (
    <>
      <Card
        className="w-40"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="p-2"></CardHeader>
        <CardContent className="flex flex-col items-center p-4 m-2">
          <img
            alt="Avatar"
            className="rounded-full"
            height="64"
            src={src}
            style={{
              aspectRatio: "64/64",
              objectFit: "cover"
            }}
            width="64"
          />
        </CardContent>
        <CardFooter className="flex justify-center p-4">
          {buttonDisplay()}
        </CardFooter>
      </Card>
    </>
  );
};

export default ConnectionCard;
