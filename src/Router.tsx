import {
  createRootRoute,
  createRoute,
  createRouter
} from "@tanstack/react-router";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Favorite from "./pages/Favorite";
import Collections from "./pages/Collections";
import Settings from "./pages/Settings";
import View from "./pages/View";
import { MainLayout } from "./components/layout/MainLayout";

//creating the base route
const rootRoute = createRootRoute({
  // component: () => (
  //   <div className="grid h-screen grid-cols-4 grid-rows-1 lg:grid-cols-5 font-poppins">
  //     <Navigation />
  //     <div className="col-span-3 overflow-auto lg:col-span-4 ">
  //       <Outlet />
  //     </div>
  //     {import.meta.env.MODE !== "production" && <TanStackRouterDevtools />}
  //   </div>
  // )

  component: () => <MainLayout />
});

// creating other routes

// TODO: need to expand it for nested routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index
});
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "search",
  component: Search
});
const favoriteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "favorites",
  component: Favorite
});
const collectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "collections",
  component: Collections
});
const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: Settings
});
const viewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/view"
});
const viewImageRoute = createRoute({
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

const appRouter = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof appRouter;
  }
}

export default appRouter;
