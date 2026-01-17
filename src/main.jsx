import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./store/AuthContext";
import { WalletProvider } from "./store/WalletContext";
import ToastProvider from "./components/ui/ToastProvider";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider as DappWalletProvider,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFullnodeUrl } from "@mysten/sui/client";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
});

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <DappWalletProvider autoConnect slushWallet={{ name: "VerifyMe" }}>
            <AuthProvider>
              <WalletProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </WalletProvider>
            </AuthProvider>
          </DappWalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
