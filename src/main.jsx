import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.jsx";
import { MotionProvider } from "./shared/MotionPreference";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/layout.css";
import "./styles/identity.css";
import "./styles/becas.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MotionProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionProvider>
  </React.StrictMode>,
);
