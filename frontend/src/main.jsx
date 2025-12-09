import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import Github from "./pages/Github.jsx";

const path = window.location.pathname.replace(/\/+$/, "") || "/";

export function RootApp() {
  if (path === "/github") {
    return <Github />;
  }
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootApp />
  </StrictMode>
);
