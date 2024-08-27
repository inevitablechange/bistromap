import Footer from "@/components/Footer";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <Footer />
    </>
  );
};

export default Layout;
