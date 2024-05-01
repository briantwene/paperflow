import { Button } from "../ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger
} from "@/components/ui/dialog";
import ConnectionCard from "./ConnectionCard";
import { useConnectionStore } from "@/lib/store";
import { useEffect } from "react";
import { ConnectionsTable } from "./connectionTable";
import { useColumns } from "./connectionTable/columns";

const ConnectionSettingsTab = () => {
  const fetchStatuses = useConnectionStore((state) => state.fetchStatuses);
  const connections = useConnectionStore((state) => state.connections);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  console.log("SWt", connections);
  const columns = useColumns();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold">Connections</h2>
        <Dialog>
          <Button>
            <DialogTrigger>Add Connection</DialogTrigger>
          </Button>
          <DialogContent className="flex flex-col sm:max-w-xl lg:max-w-5xl h-4/6">
            <DialogHeader className="text-xl font-semibold">
              Add A Connection
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 overflow-auto lg:grid-cols-4 grid-rows-auto">
              {connections.map(({ name, src, connect, active }) => (
                <ConnectionCard
                  key={name}
                  name={name}
                  src={src}
                  connect={connect}
                  active={active}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ConnectionsTable columns={columns} data={connections} />
    </div>
  );
};

export default ConnectionSettingsTab;
