import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralSettingsTab from "@/components/settings/GeneralSettingsTab";
import ConnectionSettingsTab from "@/components/settings/ConnectionSettingsTab";

const Settings = () => {
  return (
    <div className="flex flex-col w-full h-screen px-6">
      <div className="flex flex-col justify-center h-24 gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-md text-muted-foreground">Customise app settings</p>
      </div>

      <Tabs defaultValue="general" className="flex-1" orientation="vertical">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>
        <TabsContent className="flex justify-center" value="general">
          <GeneralSettingsTab />
        </TabsContent>
        <TabsContent value="connections">
          <ConnectionSettingsTab />
        </TabsContent>
      </Tabs>

      {/* <div className="flex flex-col gap-4">
        <h2 className="my-4 text-lg font-medium">Providers</h2>

        <div className="flex justify-between w-full">
          <div>
            <div className="">Reddit</div>
            <div>Status</div>
          </div>
          <div>            <Button
              text="connect"
              onClick={() => invoke("start_reddit_auth_v2")}
            />
          </div>
          <div>            <Button
              text="disconnect"
              onClick={() => invoke("revoke_reddit_auth_v2")}
            />
          </div>
        </div>
        <div className="flex justify-between w-full">
          <div>
            <div className="">Check auth status</div>
            <div>Status</div>
          </div>
          <div>            <Button
              text="check status"
              onClick={() => invoke("check_reddit_auth_status_v2").then(console.log)}
            />
          </div>
        </div>
      </div>
      <div>
        other settings
        <div>theme: {theme}</div>
        <div>path: {path}</div>
      </div> */}
    </div>
  );
};

export default Settings;
