import { RootRoute, Route, Router, Outlet } from "@tanstack/router";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Favorite from "./pages/Favorite";
import Collections from "./pages/Collections";
import Settings from "./pages/Settings";
import { TanStackRouterDevtools } from "./utils/TanStackRouterDevTools";
import Navigation from "./components/Navigation";
import View from "./pages/View";

//creating the base route
const rootRoute = new RootRoute({
  component: () => (
    <div className="flex h-screen font-poppins">
      <Navigation />
      <div className="w-screen overflow-auto">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  )
});

// creating other routes

// TODO: need to expand it for nested routes
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index
});
const searchRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "search",
  component: Search
});
const favoriteRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "favorites",
  component: Favorite
});
const collectionRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "collections",
  component: Collections
});
const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: Settings
});
const viewRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/view"
});
const viewImageRoute = new Route({
  getParentRoute: () => viewRoute,
  path: "$id",
  component: View,
  loader: ({ params: { id } }) => {
    console.log(id);
    return {
      id
    };
  }
});

//create a tree from the single routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  favoriteRoute,
  collectionRoute,
  settingsRoute,
  searchRoute,
  viewRoute.addChildren([viewImageRoute])
]);

const appRouter = new Router({ routeTree });

declare module "@tanstack/router" {
  interface Register {
    router: typeof appRouter;
  }
}


export default appRouter;
