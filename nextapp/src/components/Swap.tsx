"use client";

import React, { useState, useEffect, useCallback, FC } from "react";

import {
  BigNumberish,
  BrowserProvider,
  Contract,
  ethers,
  JsonRpcSigner,
} from "ethers";
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

interface SwapProps {
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  account: string | null;
  bsmContract: Contract | null;
  usdtContract: Contract | null;
  routerContract: Contract | null;
  bsmBalance: BigNumberish;
  usdtBalance: BigNumberish;
}

const Swap: FC<SwapProps> = ({
  signer,
  provider,
  account,
  bsmContract,
  usdtContract,
  routerContract,
  bsmBalance,
  usdtBalance,
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

      const amounts = await routerContract?.getAmountsOut(amountIn, path);
      setOutputAmount(ethers.formatUnits(amounts[1], isBsmToUsdt ? 18 : 18));
    } catch (error) {
      console.error("Error estimating output:", error);
    }
  }, [inputAmount, isBsmToUsdt, isInputValid, provider]);

  const handleSwap = async () => {
    if (!account || !provider) return;

    setIsLoading(true);

    setError(null);
    setStatus("Initiating swap...");

    try {
      const path = isBsmToUsdt
        ? [config.BSM_ADDRESS, config.USDT_ADDRESS]
        : [config.USDT_ADDRESS, config.BSM_ADDRESS];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

      if (isBsmToUsdt) {
        setStatus("Approving BSM spend...");
        const allowance = await bsmContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const amountIn = ethers.parseUnits(inputAmount, 18);
        if (allowance < amountIn) {
          const approveTx = await bsmContract?.approve(
            config.UNISWAP_V2_ROUTER,
            amountIn
          );
          await approveTx.wait();
        }
        setStatus("Swapping BSM for USDT...");
        const tx = await routerContract?.swapExactTokensForTokens(
          amountIn,
          0, // We're not setting a minimum amount out for simplicity
          path,
          account,
          deadline
        );
        setStatus("Waiting for transaction confirmation...");
        await tx.wait();
      } else {
        setStatus("Approving USDT spend...");
        const allowance = await usdtContract?.allowance(
          account,
          config.UNISWAP_V2_ROUTER
        );
        const amountIn = ethers.parseUnits(inputAmount, 18);
        if (allowance < amountIn) {
          const approveTx = await usdtContract?.approve(
            config.UNISWAP_V2_ROUTER,
            amountIn
          );
          await approveTx.wait();
        }
        setStatus("Swapping USDT for BSM...");
        const tx = await routerContract?.swapExactTokensForTokens(
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
      setIsLoading(false);
    } catch (error) {
      console.error("Swap failed:", error);
      setIsLoading(false);
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

  useEffect(() => {
    if (inputAmount !== undefined && provider) {
      getEstimatedOutput();
    }
  }, [getEstimatedOutput, inputAmount, isBsmToUsdt, provider]);

  return (
    <Flex
      minW="full"
      marginTop={8}
      marginBottom={100}
      p={4}
      bgColor="yellow.100"
      rounded="lg"
      borderWidth={1}
    >
      <Flex minW="full" flexDir="column">
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

        <Text marginBottom={3}>Swap your USDT or BSM tokens</Text>
        <Text marginBottom={3}>Network: Sepolia Ethereum</Text>

        <Flex>
          <Flex
            flex={1}
            borderWidth={1}
            borderRadius="md"
            p={4}
            mr={4}
            flexDir="column"
          >
            <Text fontWeight="bold" fontSize="20px" mb={4}>
              Swap
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
                onClick={handleSwap}
                disabled={!account || !isInputValid}
                bgColor="yellow.400"
                isLoading={isLoading}
                isDisabled={isLoading}
              >
                Swap
              </Button>
            </Flex>
          </Flex>
          <Flex
            flex={1}
            borderWidth={1}
            borderRadius="md"
            p={4}
            flexDir="column"
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

export default Swap;
