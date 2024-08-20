"use client";

import { createContext, ReactNode, useContext } from "react";
import { useAccountProvider } from "@/hooks/useAccountProvider";
interface AccountContextProps {
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const AccountContext = createContext<AccountContextProps | undefined>(
  undefined
);
export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [account, connectWallet, disconnectWallet] = useAccountProvider();
  return (
    <AccountContext.Provider
      value={{ account, connectWallet, disconnectWallet }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider)");
  }
  return context;
};
