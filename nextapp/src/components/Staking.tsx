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
import { ethers, Contract, BigNumberish } from "ethers";
import { FC, useState } from "react";

interface StakingProps {
  stakingContract: Contract | null;
  bsmContract: Contract | null;
  fetchBalances: () => Promise<void>;
  fetchStakedInfo: () => Promise<void>;
  canUnstake: boolean;
  balance: BigNumberish;
  stakedAmount: number;
  reward: number;
}

const Staking: FC<StakingProps> = ({
  stakingContract,
  bsmContract,
  fetchBalances,
  fetchStakedInfo,
  canUnstake,
  balance,
  stakedAmount,
  reward,
}) => {
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStakeLoading, setIsStakeLoading] = useState<boolean>(false);
  const [isUnstakeLoading, setIsUnstakeLoading] = useState<boolean>(false);

  const handleStake = async () => {
    if (!stakingContract || !bsmContract || !stakeAmount) return;

    setIsStakeLoading(true);

    setError(null);
    setStatus("Initiating Staking...");
    try {
      const amount = ethers.parseEther(stakeAmount);
      const minStakeAmount = ethers.parseEther("1");

      // Convert to BigInt for comparison
      const minStakeAmountBigInt = BigInt(minStakeAmount.toString());
      const amountBigInt = BigInt(amount.toString());

      if (amountBigInt < minStakeAmountBigInt) {
        throw new Error("Minimum stake amount is 1 BSM");
      }

      // Proceed with the staking process
      const approveTx = await bsmContract.approve(
        stakingContract.getAddress(),
        amount
      );
      await approveTx.wait();

      const tx = await stakingContract.stake(amount, { gasLimit: 300000 });
      await tx.wait();
      fetchBalances();
      fetchStakedInfo();
      setStakeAmount("");
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
    if (!stakingContract || !canUnstake) return;

    setIsUnstakeLoading(true);

    setError(null);
    setStatus("Initiating Unstaking...");
    try {
      const tx = await stakingContract.unstake();
      await tx.wait();
      fetchBalances();
      fetchStakedInfo();
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
            <Image src="/images/logo.png" boxSize="50px" alt="BSM icon" />
            <Text
              fontSize="4xl"
              fontWeight="bold"
              bgGradient="linear(to-r, #4682b4, #87ceeb)"
              bgClip="text"
            >
              BSM Staking
            </Text>
          </HStack>

          <Text fontSize="lg" color="gray.700">
            Stake your BSM tokens to earn rewards. APY is 12%.
          </Text>

          <HStack>
            <Text fontSize="lg">Network: Sepolia Ethereum</Text>
            <Link color="blue.600" href="#" isExternal fontSize="lg"></Link>
          </HStack>

          <Box borderWidth={1} borderRadius="md" p={4} bg="yellow.100">
            <Text fontWeight="bold" mb={2} fontSize="xl">
              Minimum Stake Requirement
            </Text>
            <Text color="red.600" fontSize="lg">
              To participate Voting, you need at least 1000 BSM.
            </Text>
            <Text color="red.600" fontSize="lg">
              Staking can only be unstaked after at least 24 weeks.
            </Text>
          </Box>

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
                Manage your position in the BSM Staking contract.
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
                  <Text fontSize="lg">BSM</Text>
                </HStack>
              </Box>{" "}
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
                    !stakedAmount || isStakeLoading || isUnstakeLoading
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
                      src="/images/logo.png"
                      boxSize="20px"
                      alt="BSM icon"
                    />
                    <Text fontSize="lg">BSM</Text>
                    <Spacer />
                    <Text fontSize="lg">
                      {Number(ethers.formatUnits(balance, 18)).toFixed(3)} BSM
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
                    <Text fontSize="lg">BSM</Text>
                    <Spacer />
                    <Text fontSize="lg">
                      {Number(ethers.formatUnits(stakedAmount, 18)).toFixed(3)}{" "}
                      BSM
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
                      {Number(ethers.formatUnits(reward, 18)).toFixed(3)} BSM
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
};

export default Staking;
