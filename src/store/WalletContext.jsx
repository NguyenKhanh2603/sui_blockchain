import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { walletService } from "../services/walletService";
import { isStrictAddress, normalizeAddress } from "../utils/address";
import { useAuth } from "./AuthContext";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const { setWalletAddress, login, user } = useAuth();
  const [state, setState] = useState({
    connected: false,
    address: "",
    balance: null,
    error: "",
    connecting: false,
    source: "",
  });
  const currentAccount = useCurrentAccount();

  // Auto-login when dApp Kit connects
  useEffect(() => {
    if (currentAccount?.address) {
       const addr = normalizeAddress(currentAccount.address);
       if (user?.walletAddress !== addr) {
         console.log("Auto-login triggered for connected wallet:", addr);
         login("issuer", { walletAddress: addr }, { useDefaults: false });
       }
    }
  }, [currentAccount, user, login]);

  const syncedAddress = normalizeAddress(state.address);

  useEffect(() => {
    if (isStrictAddress(syncedAddress)) {
      setWalletAddress?.(syncedAddress);
      walletService
        .getBalance(syncedAddress)
        .then((balance) => setState((prev) => ({ ...prev, balance })))
        .catch(() => {});
    } else {
      setWalletAddress?.("");
    }
  }, [syncedAddress, setWalletAddress]);

  useEffect(() => {
    const nextAddr = currentAccount?.address ? normalizeAddress(currentAccount.address) : "";
    if (!nextAddr) {
      if (state.source === "dappkit" && state.connected) {
        setState((prev) => ({
          ...prev,
          connected: false,
          address: "",
          balance: null,
          error: "",
          connecting: false,
          source: "",
        }));
      }
      return;
    }
    if (!isStrictAddress(nextAddr)) {
      toast.error("Wallet address is not supported.");
      return;
    }
    walletService
      .getBalance(nextAddr)
      .then((balance) =>
        setState((prev) => ({
          ...prev,
          connected: true,
          address: nextAddr,
          balance,
          error: "",
          connecting: false,
          source: "dappkit",
        }))
      )
      .catch(() => {});
  }, [currentAccount?.address, state.connected, state.source]);

  const connect = async () => {
    setState((prev) => ({ ...prev, connecting: true, error: "" }));
    try {
      const { address } = await walletService.connect();
      const normalized = normalizeAddress(address);
      if (!isStrictAddress(normalized)) {
        throw new Error("invalid_address");
      }
      const balance = await walletService.getBalance(normalized);
      setState({
        connected: true,
        address: normalized,
        balance,
        error: "",
        connecting: false,
        source: "direct",
      });
      toast.success("Wallet connected");
      return normalized;
    } catch (err) {
      const message =
        err?.message === "provider_missing"
          ? "No compatible wallet found."
          : err?.message === "invalid_address"
          ? "Wallet address is not supported."
          : "Unable to connect wallet.";
      setState({
        connected: false,
        address: "",
        balance: null,
        error: message,
        connecting: false,
        source: "",
      });
      toast.error(message);
      throw err;
    }
  };

  const disconnect = async () => {
    await walletService.disconnect();
    setWalletAddress?.("");
    setState({
      connected: false,
      address: "",
      balance: null,
      error: "",
      connecting: false,
      source: "",
    });
  };

  const refreshBalance = async () => {
    if (!isStrictAddress(syncedAddress)) return null;
    const balance = await walletService.getBalance(syncedAddress);
    setState((prev) => ({ ...prev, balance }));
    return balance;
  };

  const adjustBalance = async (delta) => {
    if (!isStrictAddress(syncedAddress)) {
      const error = "Connect wallet to continue.";
      setState((prev) => ({ ...prev, error }));
      toast.error(error);
      throw new Error("address_missing");
    }
    try {
      const balance = await walletService.adjustBalance(syncedAddress, delta);
      setState((prev) => ({ ...prev, balance, error: "" }));
      return balance;
    } catch (err) {
      if (err?.message === "insufficient_balance") {
        toast.error("Insufficient balance");
      } else {
        toast.error("Unable to update balance");
      }
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      connected: state.connected,
      address: syncedAddress,
      balance: state.balance,
      error: state.error,
      connecting: state.connecting,
      connect,
      disconnect,
      refreshBalance,
      adjustBalance,
    }),
    [state, syncedAddress]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
