"use client";

import React, { useState, useEffect, useCallback, FC } from "react";

import { ethers } from "ethers";
import { ERC20_ABI, ROUTER_ABI } from "../constants/abiConstants";
import config from "@/constants/config";

import { useAccount } from "@/context/AccountContext";
import { Button, Flex, Input, Select } from "@chakra-ui/react";

const Swap: FC = () => {
  const { signer, provider, account } = useAccount();

  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [isBsmToUsdt, setIsBsmToUsdt] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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
      const router = new ethers.Contract(
        config.UNISWAP_V2_ROUTER,
        ROUTER_ABI,
        provider
      );
      const path = isBsmToUsdt
        ? [config.BSM_ADDRESS, config.USDT_ADDRESS]
        : [config.USDT_ADDRESS, config.BSM_ADDRESS];

      const amountIn = ethers.parseUnits(inputAmount, 18);
      console.log(await provider.getNetwork(), signer, path);

      const amounts = await router.getAmountsOut(amountIn, path);
      setOutputAmount(ethers.formatUnits(amounts[1], isBsmToUsdt ? 18 : 18));
    } catch (error) {
      console.error("Error estimating output:", error);
    }
  }, [inputAmount, isBsmToUsdt, isInputValid, provider]);

  useEffect(() => {
    if (inputAmount !== undefined && provider) {
      getEstimatedOutput();
    }
  }, [getEstimatedOutput, inputAmount, isBsmToUsdt, provider]);

  const handleSwap = async () => {
    if (!account || !provider) return;

    setError(null);
    setStatus("Initiating swap...");

    try {
      const router = new ethers.Contract(
        config.UNISWAP_V2_ROUTER,
        ROUTER_ABI,
        signer
      );

      const path = isBsmToUsdt
        ? [config.BSM_ADDRESS, config.USDT_ADDRESS]
        : [config.USDT_ADDRESS, config.BSM_ADDRESS];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

      if (isBsmToUsdt) {
        setStatus("Approving BSM spend...");
        const bsmContract = new ethers.Contract(
          config.BSM_ADDRESS,
          ERC20_ABI,
          signer
        );
        const bsmAllowance = await bsmContract.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const bsmAmount = ethers.parseUnits(inputAmount, 18);
        if (bsmAllowance < amountIn) {
          const approveTx = await bsmContract.approve(
            config.UNISWAP_V2_ROUTER,
            bsmAmount
          );
          await approveTx.wait();
        }

        setStatus("Approving USDT spend...");
        const usdtContract = new ethers.Contract(
          config.USDT_ADDRESS,
          ERC20_ABI,
          signer
        );
        const usdtAllowance = await usdtContract.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const usdtAmount = ethers.parseUnits(inputAmount, 18);
        if (usdtAllowance < amountIn) {
          const approveTx = await bsmContract.approve(
            config.UNISWAP_V2_ROUTER,
            usdtAmount
          );
          await approveTx.wait();
        }
        setStatus("Adding Liquidity to BSM-USDT Pool...");
        const tx = await router.addLiquidity(
          inputAmount,
          0, // We're not setting a minimum amount out for simplicity
          path,
          account,
          deadline
        );
        setStatus("Waiting for transaction confirmation...");
        await tx.wait();
      } else {
        setStatus("Approving USDT spend...");
        const usdtContract = new ethers.Contract(
          config.USDT_ADDRESS,
          ERC20_ABI,
          signer
        );
        const allowance = await usdtContract.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const amountIn = ethers.parseUnits(inputAmount, 6);
        if (allowance < amountIn) {
          const approveTx = await usdtContract.approve(
            config.UNISWAP_V2_ROUTER,
            amountIn
          );
          await approveTx.wait();
        }
        setStatus("Swapping USDT for BSM...");
        const tx = await router.swapExactTokensForTokens(
          amountIn,
          0, // We're not setting a minimum amount out for simplicity
          path,
          account,
          deadline
        );
        setStatus("Waiting for transaction confirmation...");
        await tx.wait();
      }
      setStatus("Swap successful!");
    } catch (error) {
      console.error("Swap failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("ACTION_REJECTED")
        ) {
          errorMessage = "Swap failed: Transaction rejected";
        } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
          errorMessage = "Swap failed: Insufficient funds";
        } else if (error.message.includes("transaction failed")) {
          errorMessage = `Swap failed: Transaction failed`;
        } else {
          errorMessage = "Swap failed";
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
        Swap
      </Button>
      {status && <p>{status}</p>}
      {error && <p>{error}</p>}
    </>
  );
};

export default Swap;
