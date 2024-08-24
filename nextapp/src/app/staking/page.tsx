"use client";

import { useState, useEffect } from "react";
import { Contract, ethers } from "ethers";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Flex,
  Image,
  Link,
  useToast,
  Spacer,
} from "@chakra-ui/react";

import STAKING_CONTRACT_ABI from "../../abi/Staking.json";
import BSM_TOKEN_ABI from "../../abi/BsmToken.json";
import { useAccount } from "@/context/AccountContext";

import { stakingContractAddress as STAKING_CONTRACT_ADDRESS } from "../../constants/index";
import { bsmContractAddress as BSM_TOKEN_ADDRESS } from "../../constants/index";

export default function BSMstake() {
  const { signer } = useAccount();

  const [balance, setBalance] = useState<{ BSM: number }>({ BSM: 0 });
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [reward, setReward] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number>(0);
  const [stakedTimestamp, setStakedTimestamp] = useState<number>(0);
  const [canUnstake, setCanUnstake] = useState<boolean>(false);
  const [stakingContract, setStakingContract] = useState<Contract | null>(null);
  const [bsmToken, setBsmToken] = useState<Contract | null>(null);

  useEffect(() => {
    if (!signer) return;

    initializeEthers();
  }, [signer]);

  useEffect(() => {
    if (isConnected) {
      fetchBalances();
      fetchReward();
      fetchStakedInfo();
    }
  }, [isConnected]);

  const initializeEthers = async () => {
    try {
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT_ADDRESS,
        STAKING_CONTRACT_ABI,
        signer
      );
      const bsmToken = new ethers.Contract(
        BSM_TOKEN_ADDRESS,
        BSM_TOKEN_ABI,
        signer
      );

      setStakingContract(stakingContract);
      setBsmToken(bsmToken);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect to Ethereum:", error);
    }
  };

  const fetchBalances = async () => {
    if (signer && bsmToken) {
      try {
        const address = await signer.getAddress();
        const BSMBalance = await bsmToken.balanceOf(address);
        setBalance({
          BSM: parseFloat(ethers.formatEther(BSMBalance)),
        });
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      }
    }
  };

  const fetchReward = async () => {
    if (signer && stakingContract) {
      try {
        const address = await signer.getAddress();
        const rewardAmount = await stakingContract.calculateReward(address);
        setReward(parseFloat(ethers.formatEther(rewardAmount)));
      } catch (error) {
        console.error("Failed to fetch reward:", error);
      }
    }
  };

  const fetchStakedInfo = async () => {
    if (signer && stakingContract) {
      try {
        const address = await signer.getAddress();
        const stakedInfo = await stakingContract.stakes(address);
        setStakedAmount(parseFloat(ethers.formatEther(stakedInfo.amount)));
        setStakedTimestamp(stakedInfo.timestamp.toNumber());

        // Calculate if the user can unstake
        const currentTimestamp = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로 변환
        const canUnstake =
          currentTimestamp >=
          stakedInfo.timestamp.toNumber() + 24 * 7 * 24 * 60 * 60; // 24 weeks in seconds
        setCanUnstake(canUnstake);
      } catch (error) {
        console.error("Failed to fetch staked information:", error);
      }
    }
  };

  const handleStake = async () => {
    if (!stakingContract || !bsmToken || !stakeAmount) return;
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
      const approveTx = await bsmToken.approve(
        STAKING_CONTRACT_ADDRESS,
        amount
      );
      await approveTx.wait();

      const tx = await stakingContract.stake(amount, { gasLimit: 300000 });
      await tx.wait();
      fetchBalances();
      fetchStakedInfo();
      setStakeAmount("");
    } catch (error) {
      console.error("Staking failed:", error);
    }
  };

  const handleUnstake = async () => {
    if (!stakingContract || !canUnstake) return;
    try {
      const tx = await stakingContract.unstake();
      await tx.wait();
      fetchBalances();
      fetchStakedInfo();
    } catch (error) {
      console.error("Unstaking failed:", error);
    }
  };

  return (
    <Box maxWidth="800px" margin="auto" p={4} bg="yellow.50">
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
            <HStack mb={4}>
              <Button
                flex={1}
                onClick={handleStake}
                isDisabled={!stakeAmount || parseFloat(stakeAmount) < 1}
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
                isDisabled={!canUnstake}
                fontSize="lg"
                bg="yellow.300"
                _hover={{ bg: "yellow.400" }}
              >
                Unstake
              </Button>
            </HStack>
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
            </Box>
          </Box>
          <Box flex={1} borderWidth={1} borderRadius="md" p={4} bg="yellow.100">
            <Text fontWeight="bold" mb={4} fontSize="xl">
              Your Balance
            </Text>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="lg">Available</Text>
                <HStack>
                  <Image src="/images/logo.png" boxSize="20px" alt="BSM icon" />
                  <Text fontSize="lg">BSM</Text>
                  <Spacer />
                  <Text fontSize="lg">
                    {balance.BSM} ${balance.BSM.toFixed(2)}
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
                    {stakedAmount.toFixed(2)} ${stakedAmount.toFixed(2)}
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
                    {reward.toFixed(2)} ${reward.toFixed(2)}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
}
