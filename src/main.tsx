import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import "./global.css";

// @ts-ignore: O TypeScript às vezes demora a reconhecer módulos virtuais do Vite
import { registerSW } from "vite-plugin-pwa/register";

// Registra o Service Worker para habilitar o PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("Novo conteúdo disponível, por favor atualize.");
  },
  onOfflineReady() {
    console.log("App pronto para uso offline.");
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);