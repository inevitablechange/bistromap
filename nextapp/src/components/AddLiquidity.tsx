"use client";

import React, { useState, useEffect, useCallback, FC } from "react";

import { ethers } from "ethers";
import USDT_ABI from "../app/lib/usdtAbi.json";
import BSM_ABI from "../app/lib/bistromapAbi.json";
import ROUTER_ABI from "../app/lib/uniswapRouterAbi.json";

import config from "@/constants/config";

import { useAccount } from "@/context/AccountContext";
import { Button, Flex, Input, Select, Text } from "@chakra-ui/react";
import { Contract } from "ethers";

const AddLiquidity: FC = () => {
  const { signer, provider, account } = useAccount();

  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [isBsmToUsdt, setIsBsmToUsdt] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [bsmContract, setBsmContract] = useState<Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<Contract | null>(null);
  const [routerContract, setRouterContract] = useState<Contract | null>(null);

  const validateInputAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };

  const isInputValid = validateInputAmount(inputAmount);

  const getEstimatedOutput = useCallback(async () => {
    if (!provider) return;
    if (!isInputValid) {
      setOutputAmount("");
      return;
    }

    try {
      const path = isBsmToUsdt
        ? [config.BSM_ADDRESS, config.USDT_ADDRESS]
        : [config.USDT_ADDRESS, config.BSM_ADDRESS];

      const amountIn = ethers.parseUnits(inputAmount, 18);
      console.log(await provider.getNetwork(), signer, path);

      if (!bsmContract || !usdtContract || !routerContract) return;

      const bsmReserve = bsmContract.balanceOf(config.UNISWAP_V2_ROUTER);
      const usdtReserve = usdtContract.balanceOf(config.UNISWAP_V2_ROUTER);
      const amountOut = await routerContract.quote(
        amountIn,
        bsmReserve,
        usdtReserve
      );

      setOutputAmount(ethers.formatUnits(amountOut, isBsmToUsdt ? 18 : 18));
    } catch (error) {
      console.error("Error estimating output:", error);
    }
  }, [inputAmount, isBsmToUsdt, isInputValid, provider]);

  useEffect(() => {
    if (inputAmount !== undefined && provider) {
      getEstimatedOutput();
    }
  }, [getEstimatedOutput, inputAmount, isBsmToUsdt, provider]);

  useEffect(() => {
    if (!signer) return;

    setBsmContract(new Contract(config.BSM_ADDRESS, BSM_ABI, signer));
    setUsdtContract(new Contract(config.USDT_ADDRESS, USDT_ABI, signer));
    setRouterContract(
      new Contract(config.UNISWAP_V2_ROUTER, ROUTER_ABI, signer)
    );
  }, [signer]);

  const handleSwap = async () => {
    if (!account || !provider) return;

    setError(null);
    setStatus("Initiating swap...");

    try {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

      if (isBsmToUsdt) {
        setStatus("Approving BSM spend...");
        const bsmAllowance = await bsmContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const bsmAmount = ethers.parseUnits(inputAmount, 18);
        if (bsmAllowance < bsmAmount) {
          const approveTx = await bsmContract?.approve(
            config.UNISWAP_V2_ROUTER,
            bsmAmount
          );
          await approveTx.wait();
        }

        setStatus("Approving USDT spend...");

        const usdtAllowance = await usdtContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const usdtAmount = ethers.parseUnits(outputAmount, 18);
        if (usdtAllowance < usdtAmount) {
          const approveTx = await bsmContract?.approve(
            config.UNISWAP_V2_ROUTER,
            usdtAmount
          );
          await approveTx.wait();
        }
        setStatus("Adding Liquidity to BSM-USDT Pool...");
        const tx = await routerContract?.addLiquidity(
          bsmContract,
          usdtContract,
          bsmAmount,
          usdtAmount,
          0,
          0,
          account,
          deadline
        );
        setStatus("Waiting for transaction confirmation...");
        await tx.wait();
      } else {
        setStatus("Approving BSM spend...");
        const bsmAllowance = await bsmContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const bsmAmount = ethers.parseUnits(inputAmount, 18);
        if (bsmAllowance < bsmAmount) {
          const approveTx = await bsmContract?.approve(
            config.UNISWAP_V2_ROUTER,
            bsmAmount
          );
          await approveTx.wait();
        }

        setStatus("Approving USDT spend...");
        const usdtAllowance = await usdtContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );

        const usdtAmount = ethers.parseUnits(outputAmount, 18);
        if (usdtAllowance < usdtAmount) {
          const approveTx = await bsmContract?.approve(
            config.UNISWAP_V2_ROUTER,
            usdtAmount
          );
          await approveTx.wait();
        }
        setStatus("Adding Liquidity to BSM-USDT Pool...");
        const tx = await routerContract?.addLiquidity(
          bsmContract,
          usdtContract,
          bsmAmount,
          usdtAmount,
          0,
          0,
          account,
          deadline
        );
        setStatus("Waiting for transaction confirmation...");
        await tx.wait();
      }
      setStatus("Add Liquidity successful!");
    } catch (error) {
      console.error("Add Liquidity failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("ACTION_REJECTED")
        ) {
          errorMessage = "Add Liquidity failed: Transaction rejected";
        } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
          errorMessage = "Add Liquidity failed: Insufficient funds";
        } else if (error.message.includes("transaction failed")) {
          errorMessage = `Add Liquidity failed: Transaction failed`;
        } else {
          errorMessage = "Add Liquidity failed";
        }
      }
      setError(errorMessage);
      setStatus(null);
    }
  };

  return (
    <>
      <Select
        onChange={(e) => setIsBsmToUsdt(e.target.value === "true")}
        marginBottom={"10"}
      >
        <option value="true">BSM to USDT</option>
        <option value="false">USDT to BSM</option>
      </Select>
      <Flex flexDir={"column"} gap={4} marginBottom={4}>
        <Input
          type="number"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder={`${isBsmToUsdt ? "BSM" : "USDT"} amount`}
        />
        <Input
          type="number"
          value={outputAmount}
          readOnly
          placeholder={`${isBsmToUsdt ? "USDT" : "BSM"} amount`}
        />
      </Flex>
      <Button onClick={handleSwap} disabled={!account || !isInputValid}>
        Add Liquidity to BSM-USDT Pool
      </Button>
      <Text fontSize="20px" fontWeight="bold" align="center">
        {status && <p>{status}</p>}
        {error && <p>{error}</p>}
      </Text>
    </>
  );
};

export default AddLiquidity;
