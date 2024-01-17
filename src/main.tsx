import React from 'react'
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/router";
import appRouter from "./Router";
import { ThemeProvider } from "./components/theme-provider";
import("preline");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={appRouter} />
    </ThemeProvider>
  </React.StrictMode>
);
