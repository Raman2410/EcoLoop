import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./index.css";

// Note: StrictMode removed to prevent double-render issues during auth flow
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          fontSize: "14px",
        },
      }}
    />
  </AuthProvider>
);