import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";

// For whoever opens the console. The way into the trail.
const phosphor = "color:#00ff66;font:14px/1.6 'JetBrains Mono',monospace";
console.log(
  "%cWake up, Neo…\nThe Matrix has you…\nFollow the white rabbit.\n\n%cDrop into the shell on the page and list everything: ls -a",
  phosphor,
  "color:#7a9a86;font:12px/1.6 'JetBrains Mono',monospace",
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
