"use client";

import NavBar from "./Navbar";
import { NextPage } from "next";

const Header: NextPage = () => {
  return (
    <header style={{ width: "100%", borderBottom: "1px solid #e3e3e3" }}>
      <NavBar />
    </header>
  );
};

export default Header;
