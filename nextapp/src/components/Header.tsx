"use client";

import React, { useEffect, useState } from "react";

import Web3 from "web3";

import NavBar from "./Navbar"; // NavBar 컴포넌트를 불러옵니다
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum as any);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
    };

    checkConnection();
  }, []);

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum as any);
        const accounts = await web3.eth.requestAccounts();
        setAccount(accounts[0]);
        setIsConnected(true);
      } catch (error) {
        console.error("사용자가 요청을 거부했습니다.");
      }
    } else {
      console.error("MetaMask가 감지되지 않았습니다.");
    }
  };

  const handleConnect = () => {
    if (isConnected) {
      router.push("/mint");
    } else {
      connectMetaMask();
    }
  };

  return (
    <header style={{ width: "100%", borderBottom: "1px solid #486284" }}>
      <NavBar />
    </header>
  );
};

export default Header;
