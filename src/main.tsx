import React from 'react'
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "@tanstack/router";
import appRouter from "./Router";
import("preline");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={appRouter} />
  </React.StrictMode>
);
