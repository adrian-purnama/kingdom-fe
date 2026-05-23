import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { StudentProvider } from "./context/StudentContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <UserProvider>
        <StudentProvider>
          <App />
        </StudentProvider>
      </UserProvider>
    </AppProvider>
  </StrictMode>,
);
