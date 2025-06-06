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
import { invoke } from "@tauri-apps/api/core";
import { Check, Loader2 } from "lucide-react";
import { useConnectionStore } from "@/lib/store";

const ConnectionCard = ({ name, src, connect, active }: ConnectionObject) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const fetchStatuses = useConnectionStore((state) => state.fetchStatuses);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result: string = await invoke(connect);
      console.log("Auth result:", result);

      // Refresh the connection statuses after successful authentication
      await fetchStatuses();
    } catch (error) {
      console.error("Authentication failed:", error);
      // You might want to show a toast notification here
    } finally {
      setIsConnecting(false);
    }
  };
  const buttonDisplay = () => {
    return (
      <div className="relative flex items-center justify-center h-10">
        <Button
          className={`w-28 transition-all duration-200 ease-in-out absolute bg-transparent ${
            isHovered && active ? "bg-green-500 text-white" : ""
          } ${isHovered ? "opacity-100 visible" : "opacity-0 invisible"}`}
          disabled={active || isConnecting}
          onClick={handleConnect}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : active ? (
            <Check />
          ) : (
            "Connect"
          )}
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
