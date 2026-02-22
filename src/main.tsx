import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

// Global styles
import './styles/index.css';
import './styles/tailwind.css';
import './styles/theme.css';

// Mount the app into the #root div defined in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);