import { useState } from "react";

export const useAccountProvider = (): [
  string | null,
  () => Promise<void>,
  () => void
] => {
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        window.localStorage.setItem("loggedIn", "true");
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };
  const disconnectWallet = () => {
    setAccount(null);
    window.localStorage.removeItem("loggedIn");
  };
  return [account, connectWallet, disconnectWallet];
};
