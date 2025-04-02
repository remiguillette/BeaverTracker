import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ModalProvider } from "./lib/utils/modals";

createRoot(document.getElementById("root")!).render(
  <ModalProvider>
    <App />
  </ModalProvider>
);
