"use client";

import { useState } from "react";

const Header = () => {
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };

  return (
    <header>
      <nav>
        <h1>My DApp</h1>
        <button onClick={connectWallet}>
          {account ? `Connected: ${account}` : "Connect to MetaMask"}
        </button>
      </nav>
    </header>
  );
};

export default Header;
