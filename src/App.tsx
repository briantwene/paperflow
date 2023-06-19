import Navigation from "./components/Navigation";
import { TanStackRouterDevtools } from "./utils/TanStackRouterDevTools";
import { Outlet } from "@tanstack/router";

function App() {
  return (
    <div className="flex h-screen font-poppins">
      <Navigation />
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </div>
  );
}

export default App;
