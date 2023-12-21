import Button from "../components/common/Button";
import { invoke } from "@tauri-apps/api/tauri";

const Settings = () => {
  return (
    <div className="w-full px-6">
      <h1 className="font-semibold text-title">Settings</h1>

      <div className="flex flex-col gap-4">
        <h2 className="my-4 text-lg font-medium">Providers</h2>

        <div className="flex justify-between w-full">
          <div>
            <div className="">Reddit</div>
            <div>Status</div>
          </div>
          <div>
            <Button
              text="connect"
              onClick={() => invoke("start_reddit_login")}
            />
          </div>
          <div>
            <Button
              text="disconnect"
              onClick={() => invoke("revoke_token", { provider: "reddit" })}
            />
          </div>
        </div>
        <div className="flex justify-between w-full">
          <div>
            <div className="">Check auth status</div>
            <div>Status</div>
          </div>
          <div>
            <Button
              text="connect"
              onClick={() => invoke("auth_status").then(console.log)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
