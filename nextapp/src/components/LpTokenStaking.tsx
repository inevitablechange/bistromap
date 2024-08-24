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
import { ethers, Contract } from "ethers";
import { FC, useState } from "react";

interface LpTokenStakingProps {
  lpTokenStakingContract: Contract | null;
  bsmContract: Contract | null;
  LPTOKEN_STAKING_CONTRACT_ADDRESS: string;
  fetchBalances: () => Promise<void>;
  fetchLpTokenStakedInfo: () => Promise<void>;
  balance: { BSM: number };
  lpTokenStakedAmount: number;
  lpTokenReward: number;
}

const LpTokenStaking: FC<LpTokenStakingProps> = ({
  lpTokenStakingContract,
  bsmContract,
  LPTOKEN_STAKING_CONTRACT_ADDRESS,
  fetchBalances,
  fetchLpTokenStakedInfo,
  balance,
  lpTokenStakedAmount,
  lpTokenReward,
}) => {
  const [stakeAmount, setStakeAmount] = useState<string>("");

  const handleStake = async () => {
    if (!lpTokenStakingContract || !bsmContract || !stakeAmount) return;
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
        LPTOKEN_STAKING_CONTRACT_ADDRESS,
        amount
      );
      await approveTx.wait();

      const tx = await lpTokenStakingContract.stake(amount, {
        gasLimit: 300000,
      });
      await tx.wait();
      fetchBalances();
      fetchLpTokenStakedInfo();
      setStakeAmount("");
    } catch (error) {
      console.error("Staking failed:", error);
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
                  fontSize="lg"
                  bg="yellow.300"
                  _hover={{ bg: "yellow.400" }}
                >
                  Stake
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
                    <Text fontSize="lg">{balance.BSM.toFixed(2)} lpBSM</Text>
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
                      {lpTokenStakedAmount.toFixed(2)} lpBSM
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
                    <Text fontSize="lg">{lpTokenReward.toFixed(2)} BSM</Text>
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

export default LpTokenStaking;
