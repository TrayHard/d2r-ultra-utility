import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/entrypoint-components/App.tsx";
import "./app/entrypoint-components/App.css";
import "./shared/assets/fonts.css";
import "./shared/i18n";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
