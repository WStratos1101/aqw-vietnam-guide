import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/source-sans-3/latin-700.css";
import "@fontsource/source-sans-3/latin-900.css";
import "@fontsource/source-sans-3/vietnamese-400.css";
import "@fontsource/source-sans-3/vietnamese-600.css";
import "@fontsource/source-sans-3/vietnamese-700.css";
import "@fontsource/source-sans-3/vietnamese-900.css";

import "./styles/global.css";
import './styles/themes.css';
import { App } from "./App";
import {loadRouteViews} from './features/route-views';
// Keep prerendered Hero visible while its route code loads. All route CSS is
// in the initial stylesheet; server HTML and metadata never depend on Suspense.
loadRouteViews(location.pathname).then(()=>createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)).catch(()=>{const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='Không tải được phần tương tác. Hãy tải lại trang.';document.getElementById('root')?.prepend(p);});
