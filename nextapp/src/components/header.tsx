"use client";

import { Flex } from "@chakra-ui/react";
import NavBar from "./Navbar";
import { NextPage } from "next";

const Header: NextPage = () => {
  return (
    <Flex minWidth={"1440px"} justifyContent={"center"}>
      <NavBar />
    </Flex>
  );
};

export default Header;
