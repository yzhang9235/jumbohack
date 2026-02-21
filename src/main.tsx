// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from './app/App' 
// import './styles/fonts.css'
// import './styles/index.css'
// import './styles/tailwind.css'
// import './styles/theme.css'

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// import ReactDOM from "react-dom/client";

// const el = document.getElementById("root");
// console.log("main loaded, root =", el);

// ReactDOM.createRoot(el!).render(
//   <div style={{ padding: 40, fontSize: 24 }}>React mounted ✅</div>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import './styles/fonts.css';
import './styles/index.css';
import './styles/tailwind.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);