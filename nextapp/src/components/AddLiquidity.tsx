"use client";

import React, { useState, useEffect, useCallback, FC } from "react";

import { BigNumberish, BrowserProvider, ethers, JsonRpcSigner } from "ethers";

import config from "@/constants/config";

import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  Select,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { Contract } from "ethers";

interface AddLiquidityProps {
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  account: string | null;
  bsmContract: Contract | null;
  usdtContract: Contract | null;
  routerContract: Contract | null;
  pairContract: Contract | null;
  bsmBalance: BigNumberish;
  usdtBalance: BigNumberish;
  lpBalance: BigNumberish;
}

const AddLiquidity: FC<AddLiquidityProps> = ({
  signer,
  provider,
  account,
  bsmContract,
  usdtContract,
  routerContract,
  bsmBalance,
  usdtBalance,
  lpBalance,
}) => {
  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [isBsmToUsdt, setIsBsmToUsdt] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleAddLiquidity = async () => {
    if (!account || !provider) return;

    setIsLoading(true);

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
      setIsLoading(false);
    } catch (error) {
      console.error("Add Liquidity failed:", error);
      setIsLoading(false);
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
    <Flex
      minW="full"
      marginTop={8}
      marginBottom={100}
      p={4}
      bgColor="yellow.50"
      rounded="lg"
      borderWidth={1}
    >
      <Flex width="800px" flexDir="column">
        <Flex marginBottom={4} alignItems="center">
          <Image src="/images/logo.png" boxSize="40px" alt="BSM icon" />
          <Text
            fontSize="3xl"
            fontWeight="bold"
            color="blue.400"
            marginLeft={2}
          >
            BSM-USDT Liquidity-Pool
          </Text>
        </Flex>

        <Text marginBottom={3}>Add Liquidity to BSM-USDT Pool</Text>
        <Text marginBottom={3}>Network: Sepolia Ethereum</Text>

        <Flex>
          <Flex
            flex={1}
            borderWidth={1}
            borderRadius="md"
            p={4}
            mr={4}
            flexDir="column"
            bgColor="yellow.100"
          >
            <Text fontWeight="bold" fontSize="20px" mb={4}>
              Add Liquidity
            </Text>
            <Flex mb={4} flexDir="column">
              <Select
                onChange={(e) => setIsBsmToUsdt(e.target.value === "true")}
                marginBottom={"4"}
                borderColor={"black"}
              >
                <option value="true">BSM to USDT</option>
                <option value="false">USDT to BSM</option>
              </Select>
              <Flex
                flexDir={"column"}
                gap={4}
                marginBottom={4}
                justifyContent="center"
              >
                <Flex mb={2} alignItems="center">
                  <Input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder={`${isBsmToUsdt ? "BSM" : "USDT"} amount`}
                  />
                  <Text minW={14} align="center">
                    {isBsmToUsdt ? "BSM" : "USDT"}
                  </Text>
                </Flex>
                <Flex mb={2} alignItems="center">
                  <Input
                    type="number"
                    value={outputAmount}
                    readOnly
                    placeholder={`${isBsmToUsdt ? "USDT" : "BSM"} amount`}
                  />
                  <Text minW={14} align="center">
                    {isBsmToUsdt ? "USDT" : "BSM"}
                  </Text>
                </Flex>
              </Flex>
              <Button
                onClick={handleAddLiquidity}
                disabled={!account || !isInputValid}
                bgColor="yellow.400"
                isLoading={isLoading}
                isDisabled={isLoading}
                bg="yellow.300"
                _hover={{ bg: "yellow.400" }}
              >
                Add Liquidity
              </Button>
            </Flex>
          </Flex>
          <Flex
            flex={1}
            borderWidth={1}
            borderRadius="md"
            p={4}
            flexDir="column"
            bgColor="yellow.100"
          >
            <Text fontWeight="bold" fontSize="20px" mb={4}>
              Your Balance
            </Text>
            <Flex flexDir="column" align="stretch">
              <Box marginBottom={4}>
                <Text fontWeight="600">Available</Text>
                <Flex marginTop={3} alignItems="center">
                  <Image src="/images/logo.png" boxSize="20px" alt="BSM icon" />
                  <Text paddingLeft={2}>BSM</Text>
                  <Spacer />
                  <Text>
                    {Number(ethers.formatUnits(bsmBalance, 18)).toFixed(3)} BSM
                  </Text>
                </Flex>
                <Flex marginTop={3} alignItems="center">
                  <Image
                    src="/images/UsdtLogo.png"
                    boxSize="20px"
                    alt="BSM icon"
                  />
                  <Text paddingLeft={2}>USDT</Text>
                  <Spacer />
                  <Text>
                    $ {Number(ethers.formatUnits(usdtBalance, 18)).toFixed(3)}
                  </Text>
                </Flex>
              </Box>
              <Box marginBottom={4}>
                <Text fontWeight="600">Current LP Tokens</Text>
                <Flex marginTop={3} alignItems="center">
                  <Image
                    src="/images/logo2.png"
                    boxSize="20px"
                    alt="BSM icon"
                  />
                  <Text paddingLeft={2}>lpBSM</Text>
                  <Spacer />
                  <Text>
                    {Number(ethers.formatUnits(lpBalance, 18)).toFixed(3)} lpBSM
                  </Text>
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Flex>
        <Text marginTop={4} fontSize="20px" fontWeight="bold" align="center">
          {status && <p>{status}</p>}
          {error && <p>{error}</p>}
        </Text>
      </Flex>
    </Flex>
  );
};

export default AddLiquidity;
