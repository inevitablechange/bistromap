import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  Link,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ethers, Contract, BigNumberish, JsonRpcSigner } from "ethers";
import { FC, useState } from "react";
import config from "@/constants/config";

interface LpTokenStakingProps {
  signer: JsonRpcSigner | null;
  lpTokenStakingContract: Contract | null;
  bsmContract: Contract | null;
  lpTokenContract: Contract | null;
  fetchBalances: () => Promise<void>;
  fetchLpTokenBalances: () => Promise<void>;
  fetchLpTokenStakedInfo: () => Promise<void>;
  lpTokenBalance: BigNumberish;
  lpTokenStakedAmount: number;
  lpTokenReward: number;
}

const LpTokenStaking: FC<LpTokenStakingProps> = ({
  signer,
  lpTokenStakingContract,
  bsmContract,
  lpTokenContract,
  fetchBalances,
  fetchLpTokenBalances,
  fetchLpTokenStakedInfo,
  lpTokenBalance,
  lpTokenStakedAmount,
  lpTokenReward,
}) => {
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStakeLoading, setIsStakeLoading] = useState<boolean>(false);
  const [isUnstakeLoading, setIsUnstakeLoading] = useState<boolean>(false);

  const handleStake = async () => {
    if (!lpTokenStakingContract || !bsmContract || !stakeAmount) return;

    setIsStakeLoading(true);

    setError(null);
    setStatus("Initiating Staking...");
    try {
      setStatus("Approving lpBSM spend...");
      const allowance = await lpTokenContract?.allowance(
        signer?.address,
        config.LP_BSM_STAKING
      );
      const amountIn = ethers.parseUnits(stakeAmount, 18);

      if (allowance < amountIn) {
        const approveTx = await lpTokenContract?.approve(
          config.LP_BSM_STAKING,
          amountIn
        );
        await approveTx.wait();
      }

      setStatus("Staking lpBSM...");
      const tx = await lpTokenStakingContract.deposit(amountIn, {
        gasLimit: 300000,
      });
      setStatus("Waiting for transaction confirmation...");
      await tx.wait();

      fetchBalances();
      fetchLpTokenBalances();
      fetchLpTokenBalances();
      fetchLpTokenStakedInfo();
      setStakeAmount("");
      setStatus("Stake successful!");
      setIsStakeLoading(false);
    } catch (error) {
      console.error("Stake failed:", error);
      setIsStakeLoading(false);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("ACTION_REJECTED")
        ) {
          errorMessage = "Stake failed: Transaction rejected";
        } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
          errorMessage = "Stake failed: Insufficient funds";
        } else if (error.message.includes("transaction failed")) {
          errorMessage = `Stake failed: Transaction failed`;
        } else {
          errorMessage = "Stake failed";
        }
      }
      setError(errorMessage);
      setStatus(null);
    }
  };

  const handleUnstake = async () => {
    if (!lpTokenStakingContract) return;

    setIsUnstakeLoading(true);

    setError(null);
    setStatus("Initiating Unstaking...");
    try {
      const tx = await lpTokenStakingContract.withdraw();

      await tx.wait();
      fetchBalances();
      fetchLpTokenBalances();
      fetchLpTokenStakedInfo();
      setIsUnstakeLoading(false);
    } catch (error) {
      console.error("Stake failed:", error);
      setIsUnstakeLoading(false);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("ACTION_REJECTED")
        ) {
          errorMessage = "Stake failed: Transaction rejected";
        } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
          errorMessage = "Stake failed: Insufficient funds";
        } else if (error.message.includes("transaction failed")) {
          errorMessage = `Stake failed: Transaction failed`;
        } else {
          errorMessage = "Stake failed";
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
      <Box width="800px" margin="auto" p={4} bg="yellow.50">
        <VStack spacing={6} align="stretch">
          <HStack>
            <Image src="/images/logo2.png" boxSize="50px" alt="BSM icon" />
            <Text
              fontSize="4xl"
              fontWeight="bold"
              bgGradient="linear(to-r, #4682b4, #87ceeb)"
              bgClip="text"
            >
              lpBSM Token Staking
            </Text>
          </HStack>

          <Text fontSize="lg" color="gray.700">
            Stake your lpBSM tokens to earn rewards.You can get lpBSM by
            providing liquidity to BSM-USDT pool.
          </Text>

          <HStack>
            <Text fontSize="lg">Network: Sepolia Ethereum</Text>
            <Link color="blue.600" href="#" isExternal fontSize="lg"></Link>
          </HStack>

          <Flex>
            <Box
              flex={1}
              borderWidth={1}
              borderRadius="md"
              p={4}
              mr={4}
              bg="yellow.100"
            >
              <Text fontWeight="bold" mb={4} fontSize="xl">
                Manage
              </Text>
              <Text color="gray.700" mb={4} fontSize="lg">
                Manage your position in the lpBSM Staking contract.
              </Text>

              <Box borderWidth={1} borderRadius="md" p={4} bg="yellow.100">
                <Text mb={2} fontSize="lg">
                  Stake
                </Text>
                <HStack mb={2}>
                  <Input
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    type="number"
                    min="1"
                    fontSize="lg"
                  />
                  <Text fontSize="lg">lpBSM</Text>
                </HStack>
              </Box>
              <HStack mt={4}>
                <Button
                  flex={1}
                  onClick={handleStake}
                  isLoading={isStakeLoading}
                  isDisabled={
                    !stakeAmount || isStakeLoading || isUnstakeLoading
                  }
                  fontSize="lg"
                  bg="yellow.300"
                  _hover={{ bg: "yellow.400" }}
                >
                  Stake
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  onClick={handleUnstake}
                  isLoading={isUnstakeLoading}
                  isDisabled={
                    !lpTokenStakedAmount || isStakeLoading || isUnstakeLoading
                  }
                  fontSize="lg"
                  bg="yellow.300"
                  _hover={{ bg: "yellow.400" }}
                >
                  Unstake
                </Button>
              </HStack>
            </Box>
            <Box
              flex={1}
              borderWidth={1}
              borderRadius="md"
              p={4}
              bg="yellow.100"
            >
              <Text fontWeight="bold" mb={4} fontSize="xl">
                Your Balance
              </Text>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontSize="lg">Available</Text>
                  <HStack>
                    <Image
                      src="/images/logo2.png"
                      boxSize="20px"
                      alt="BSM icon"
                    />
                    <Text fontSize="lg">lpBSM</Text>
                    <Spacer />
                    <Text fontSize="lg">
                      {Number(ethers.formatUnits(lpTokenBalance, 18)).toFixed(
                        3
                      )}{" "}
                      lpBSM
                    </Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="lg">Staked</Text>
                  <HStack>
                    <Image
                      src="/images/logo2.png"
                      boxSize="20px"
                      alt="BSM icon"
                    />
                    <Text fontSize="lg">lpBSM</Text>
                    <Spacer />
                    <Text fontSize="lg">
                      {Number(
                        ethers.formatUnits(lpTokenStakedAmount, 18)
                      ).toFixed(3)}{" "}
                      lpBSM
                    </Text>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="lg">Rewards</Text>
                  <HStack>
                    <Image
                      src="/images/logo.png"
                      boxSize="20px"
                      alt="Reward icon"
                    />
                    <Text fontSize="lg">BSM</Text>
                    <Spacer />
                    <Text fontSize="lg">
                      {Number(ethers.formatUnits(lpTokenReward, 18)).toFixed(3)}
                      BSM
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </Flex>
        </VStack>
        <Text marginTop={4} fontSize="20px" fontWeight="bold" align="center">
          {status && <p>{status}</p>}
          {error && <p>{error}</p>}
        </Text>
      </Box>
    </Flex>
  );
};

export default LpTokenStaking;
