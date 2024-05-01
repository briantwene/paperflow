import { ConnectionObject } from "@/components/enums";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useConnectionStore } from "@/lib/store";

export const useColumns = (): ColumnDef<ConnectionObject>[] => {
  const disconnect = useConnectionStore((state) => state.disconnect);

  return [
    {
      accessorKey: "name",
      header: "App Name",
      cell: ({ row }) => {
        const { name, src } = row.original;

        return (
          <div className="flex items-center gap-4">
            <Avatar className="w-8 h-8">
              <AvatarImage src={src} />
            </Avatar>

            <div className="font-semibold">{name}</div>
          </div>
        );
      }
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const { active } = row.original;

        return (
          <div className={active ? "text-green-500" : "text-red-500"}>
            {active ? "Connected" : "Disconnected"}
          </div>
        );
      }
    },

    {
      id: "actions",
      cell: ({ row }) => {
        const connection = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => disconnect(connection.name)}
              >
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];
};


