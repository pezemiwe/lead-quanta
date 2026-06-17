import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

const CHUNK_RELOAD_KEY = "__chunk_reload_attempted__";

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  // Prevent hard reload loops if the deployment is still inconsistent.
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

window.addEventListener("load", () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
