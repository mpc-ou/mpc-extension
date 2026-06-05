import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import App from "./app.tsx";
import "@/assets/globals.css";

import { ConfirmDialogProvider } from "@/hooks/use-confirm";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Toaster richColors />
    <ConfirmDialogProvider />
  </React.StrictMode>
);
