"use client";

import React, { useState } from "react";
import { NextPage } from "next";
import { Button, Flex } from "@chakra-ui/react";
import Swap from "@/components/Swap";
import AddLiquidity from "@/components/AddLiquidity";

const SwapPage: NextPage = () => {
  const [activeComponent, setActiveComponent] = useState<string>("swap");

  return (
    <Flex flexDir={"column"} padding={"20"} minWidth={"600px"}>
      <Flex marginBottom={4} gap={4} justifyContent={"center"}>
        <Button
          bgColor={activeComponent === "swap" ? "yellow.400" : "gray.100"}
          onClick={() => setActiveComponent("swap")}
          flex={1}
        >
          Swap
        </Button>
        <Button
          flex={1}
          bgColor={activeComponent === "swap" ? "gray.100" : "yellow.400"}
          onClick={() => setActiveComponent("addLiquidity")}
        >
          Add Liquidity
        </Button>
      </Flex>
      {activeComponent === "swap" ? <Swap /> : <AddLiquidity />}
    </Flex>
  );
};

export default SwapPage;
