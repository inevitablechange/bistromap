"use client";

import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { BigNumberish, Contract } from "ethers";

import { Button, Flex } from "@chakra-ui/react";
import Swap from "@/components/Swap";
import AddLiquidity from "@/components/AddLiquidity";
import { useAccount } from "@/context/AccountContext";

import USDT_ABI from "../../abi/UsdtToken.json";
import BSM_ABI from "../../abi/BsmToken.json";
import ROUTER_ABI from "../../abi/UniswapRouter.json";
import PAIR_ABI from "../../abi/UniswapPair.json";
import config from "@/constants/config";

const SwapPage: NextPage = () => {
  const { signer, provider, account } = useAccount();

  const [activeComponent, setActiveComponent] = useState<string>("swap");
  const [bsmContract, setBsmContract] = useState<Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<Contract | null>(null);
  const [routerContract, setRouterContract] = useState<Contract | null>(null);
  const [pairContract, setPairContract] = useState<Contract | null>(null);
  const [bsmBalance, setBsmBalance] = useState<BigNumberish>(BigInt(0));
  const [usdtBalance, setUsdtBalance] = useState<BigNumberish>(BigInt(0));
  const [lpBalance, setLpBalance] = useState<BigNumberish>(BigInt(0));

  const getBalances = async () => {
    if (!signer || !bsmContract || !usdtContract || !pairContract) return;

    try {
      const bsmBal = await bsmContract.balanceOf(signer.address);
      const usdtBal = await usdtContract.balanceOf(signer.address);
      const lpBal = await pairContract.balanceOf(signer.address);

      setBsmBalance(bsmBal);
      setUsdtBalance(usdtBal);
      setLpBalance(lpBal);
    } catch (error) {
      console.error("Fail getting balances of tokens");
    }
  };

  useEffect(() => {
    if (!signer) return;

    const bsmCtr = new Contract(config.BSM_ADDRESS, BSM_ABI, signer);
    const usdtCtr = new Contract(config.USDT_ADDRESS, USDT_ABI, signer);
    const routerCtr = new Contract(
      config.UNISWAP_V2_ROUTER,
      ROUTER_ABI,
      signer
    );
    const pairCtr = new Contract(config.UNISWAP_V2_PAIR, PAIR_ABI, signer);

    setBsmContract(bsmCtr);
    setUsdtContract(usdtCtr);
    setRouterContract(routerCtr);
    setPairContract(pairCtr);
  }, [signer]);

  useEffect(() => {
    if (!signer || !bsmContract || !usdtContract || !pairContract) return;

    getBalances();
  }, [signer, bsmContract, usdtContract, pairContract]);

  return (
    <Flex flexDir={"column"} padding={"20"} minWidth={"800px"} align={"center"}>
      <Flex gap={4} justifyContent={"center"} minW={"full"}>
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
      {activeComponent === "swap" ? (
        <Swap
          signer={signer}
          provider={provider}
          account={account}
          bsmContract={bsmContract}
          usdtContract={usdtContract}
          routerContract={routerContract}
          bsmBalance={bsmBalance}
          usdtBalance={usdtBalance}
          getBalances={getBalances}
        />
      ) : (
        <AddLiquidity
          signer={signer}
          provider={provider}
          account={account}
          bsmContract={bsmContract}
          usdtContract={usdtContract}
          routerContract={routerContract}
          bsmBalance={bsmBalance}
          usdtBalance={usdtBalance}
          lpBalance={lpBalance}
          getBalances={getBalances}
        />
      )}
    </Flex>
  );
};

export default SwapPage;
