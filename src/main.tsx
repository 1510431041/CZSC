import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { useManualStore } from "@/store/useManualStore";
import "./index.css";

// 应用启动：优先从 IndexedDB 加载本地项目；无数据时自动播种示例项目
void useManualStore.getState().initialize();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
