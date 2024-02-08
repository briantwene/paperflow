import React from 'react'
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/react-router";
import appRouter from "./Router";
import { ThemeProvider } from "./components/theme-provider";
import StoreLoader from "./lib/storeLoader";
import("preline");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <StoreLoader>
        <RouterProvider router={appRouter} />
      </StoreLoader>
    </ThemeProvider>
  </React.StrictMode>
);
