import { useState } from "react";
import {
  Moon,
  Sun,
  Laptop,
  Folder,
  LogIn,
  LogOut,
  Trash,
  Plus,
  Loader2,
  Settings as SettingsIcon
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  useSettingsStore,
  useConnectionStore,
  useConnectionActions
} from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { open } from "@tauri-apps/plugin-dialog";

// Define provider types
type ProviderType = "reddit" | "wallhaven";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const settingsStore = useSettingsStore();
  const connectionStore = useConnectionStore();
  const {
    connect,
    disconnect,
    isConnecting,
    addSource,
    removeSource: removeSourceFromStore
  } = useConnectionActions();
  const [isConnectingToProvider, setIsConnectingToProvider] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [bypassAuth, setBypassAuth] = useState(false);
  // Get reddit connection from store
  const redditConnection = connectionStore.connections.find(
    (conn) => conn.name.toLowerCase() === "reddit"
  );
  const redditProvider = {
    type: "reddit" as ProviderType,
    isConnected: redditConnection?.active || false,
    username: redditConnection?.username,
    sources: redditConnection?.sources || []
  };

  console.log("reddit provider", redditProvider)

  const handleConnectReddit = async () => {
    setIsConnectingToProvider(true);
    try {
      const success = await connect("reddit");
      if (success) {
        toast({
          title: "Connected Successfully",
          description: "You're now connected to Reddit"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Reddit",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting",
        variant: "destructive"
      });
    } finally {
      setIsConnectingToProvider(false);
    }
  };

  const handleDisconnectReddit = async () => {
    try {
      const success = await disconnect("reddit");
      if (success) {
        toast({
          title: "Disconnected",
          description: "You've been disconnected from Reddit"
        });
      }
    } catch (error) {
      toast({
        title: "Disconnection Error",
        description: "An error occurred while disconnecting",
        variant: "destructive"
      });
    }
  };
  const handleAddSource = (provider: ProviderType) => {
    if (!newSource.trim()) {
      toast({
        title: "Source Required",
        description: "Please enter a valid subreddit name",
        variant: "destructive"
      });
      return;
    }

    addSource(provider, newSource.trim());
    setNewSource("");
    toast({
      title: "Source Added",
      description: `Added r/${newSource} to your sources`
    });
  };
  const handleRemoveSource = (provider: ProviderType, source: string) => {
    removeSourceFromStore(provider, source);
  };
  const handleSetDownloadLocation = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        defaultPath: settingsStore.path
      });

      if (selectedPath) {
        await settingsStore.setDownloadPath(selectedPath as string);
        toast({
          title: "Location Updated",
          description: "Wallpaper download location has been updated"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update download location",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-8 overflow-x-hidden">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and connections.
          </p>
        </div>

        <div className="grid max-w-full gap-8">
          {/* Appearance */}
          <Card className="max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how Paper Flow looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    className="w-24"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    className="w-24"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    className="w-24"
                    onClick={() => setTheme("system")}
                  >
                    <Laptop className="w-4 h-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card className="max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Storage
              </CardTitle>
              <CardDescription>
                Configure where your wallpapers will be saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center max-w-full min-w-0 gap-2 p-3 overflow-hidden border rounded-md bg-muted/30">
                <Folder className="flex-shrink-0 w-5 h-5 text-muted-foreground" />
                <span className="flex-1 min-w-0 text-sm truncate">
                  {settingsStore.path}
                </span>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleSetDownloadLocation}
              >
                Change Location
              </Button>
            </CardContent>
          </Card>

          {/* Providers */}
          <Card className="max-w-full overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Providers
              </CardTitle>
              <CardDescription>
                Connect to wallpaper providers and manage your sources.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Development Mode Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium">Development Mode</h3>
                    <p className="text-sm text-muted-foreground">
                      Bypass authentication for testing
                    </p>
                  </div>
                  <Button
                    variant={bypassAuth ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBypassAuth(!bypassAuth)}
                    className="flex-shrink-0"
                  >
                    {bypassAuth ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
              <Separator /> {/* Reddit */}
              <div className="space-y-4">
                {" "}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">Reddit</h3>
                      {redditProvider?.isConnected &&
                        redditProvider.username && (
                          <Badge variant="secondary" className="text-xs">
                            u/{redditProvider.username}
                          </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Browse wallpapers from subreddits
                    </p>
                  </div>
                  {redditProvider?.isConnected ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnectReddit}
                      className="flex-shrink-0"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleConnectReddit}
                      disabled={
                        isConnectingToProvider || isConnecting === "reddit"
                      }
                      className="flex-shrink-0"
                    >
                      {isConnectingToProvider || isConnecting === "reddit" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {redditProvider?.isConnected && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <Label>Subreddit Sources</Label>
                      <div className="flex flex-wrap gap-2">
                        {redditProvider.sources.map((source) => (
                          <Badge
                            key={source}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            r/{source}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-4 h-4 p-0 ml-1 hover:bg-transparent hover:text-destructive"
                              onClick={() =>
                                handleRemoveSource("reddit", source)
                              }
                            >
                              <Trash className="w-3 h-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Input
                          placeholder="Add subreddit"
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className="max-w-[200px] min-w-0"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddSource("reddit");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddSource("reddit")}
                          className="flex-shrink-0"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Separator />
              {/* Wallhaven */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium">Wallhaven</h3>
                    <p className="text-sm text-muted-foreground">
                      Access Wallhaven's extensive collection
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    Coming Soon
                  </Badge>
                </div>
              </div>
              <Separator />
              {/* Unsplash */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium">Unsplash</h3>
                    <p className="text-sm text-muted-foreground">
                      High-quality free photos
                    </p>
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
