import { storeEthereumAddress } from "@/utils/ethereumAddressHandler";
import { BrowserProvider, JsonRpcSigner, ethers } from "ethers";
import { useState } from "react";

export const useAccountProvider = (): [
  BrowserProvider | null,
  JsonRpcSigner | null,
  string | null,
  () => Promise<void>,
  () => void
] => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      const newSigner = await newProvider.getSigner();
      setSigner(newSigner);

      const address = await newSigner.getAddress();
      setAccount(address);

      window.localStorage.setItem("loggedIn", "true");
      await storeEthereumAddress(address);
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error);
    }
  };
  const disconnectWallet = () => {
    setAccount(null);
    window.localStorage.removeItem("loggedIn");
  };
  return [provider, signer, account, connectWallet, disconnectWallet];
};
