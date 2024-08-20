"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
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

// 스테이킹 컨트랙트 ABI (예시, 실제 ABI로 교체 필요)
const STAKING_CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_BSMToken",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Claimed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Staked",
    type: "event",
  },
  {
    inputs: [],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Unstaked",
    type: "event",
  },
  {
    inputs: [],
    name: "BSMToken",
    outputs: [
      {
        internalType: "contract BSM",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "calculateReward",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FIXED_APR",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MINIMUM_STAKE_AMOUNT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MINIMUM_STAKE_PERIOD",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "SECONDS_PER_YEAR",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "stakes",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastClaimTimestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStaked",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const STAKING_CONTRACT_ADDRESS = "0xe0BCdC123cb6AD1D5B2Fc22880D4Ea8627FE7D60"; // 실제 컨트랙트 주소로 교체

// BSM 토큰 ABI (예시, 실제 ABI로 교체 필요)
const BSM_TOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "beneficiary",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "buyPrivateSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_privateSalesStart",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FORTY_EIGHT_WEEKS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "NINETY_SIX_WEEKS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRICE_PER_TOKEN",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "privateSaleAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "privateSalesDuring",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "privateSalesLimitPerBeneficiary",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "privateSalesRelease",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "privateSalesStart",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TWENTY_FOUR_WEEKS",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdtToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const BSM_TOKEN_ADDRESS = "0x79Ae9522a82d9c30159B18C6831d6540F68811fB"; // 실제 BSM 토큰 주소로 교체

export default function BSMstake() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [stakingContract, setStakingContract] =
    useState<ethers.Contract | null>(null);
  const [bsmToken, setBsmToken] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<{ BSM: number }>({ BSM: 0 });
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [reward, setReward] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [stakedAmount, setStakedAmount] = useState<number>(0);

  const toast = useToast();

  useEffect(() => {
    initializeEthers();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchBalances();
      fetchReward();
      fetchStakedAmount();
    }
  }, [isConnected]);

  const initializeEthers = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
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

        setProvider(provider);
        setSigner(signer);
        setStakingContract(stakingContract);
        setBsmToken(bsmToken);
        setIsConnected(true);

        window.ethereum.on("accountsChanged", () => {
          window.location.reload();
        });
      } catch (error) {
        console.error("Failed to connect to Ethereum:", error);
        toast({
          title: "Connection Failed",
          description: "Failed to connect to Ethereum network.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Ethereum not detected",
        description: "Please install MetaMask or another Ethereum wallet.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
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

  const fetchStakedAmount = async () => {
    if (signer && stakingContract) {
      try {
        const address = await signer.getAddress();
        const stakedInfo = await stakingContract.stakes(address);
        setStakedAmount(parseFloat(ethers.formatEther(stakedInfo.amount)));
      } catch (error) {
        console.error("Failed to fetch staked amount:", error);
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
      fetchStakedAmount();
      setStakeAmount("");
      toast({
        title: "Staking Successful",
        description: `Successfully staked ${stakeAmount} BSM`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Staking failed:", error);
      toast({
        title: "Staking Failed",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnstake = async () => {
    if (!stakingContract) return;
    try {
      const tx = await stakingContract.unstake();
      await tx.wait();
      fetchBalances();
      fetchStakedAmount();
      toast({
        title: "Unstaking Successful",
        description: "Successfully unstaked your BSM",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Unstaking failed:", error);
      toast({
        title: "Unstaking Failed",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxWidth="800px" margin="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <HStack>
          <Image src="/images/logo.png" boxSize="40px" alt="BSM icon" />
          <Text fontSize="3xl" fontWeight="bold" color="blue.400">
            BSM Staking
          </Text>
        </HStack>

        <Text color="gray.600">
          Stake your BSM tokens to earn rewards. APY is 12%.
        </Text>

        <HStack>
          <Text>Network: Sepolia Ethereum</Text>
          <Link color="blue.500" href="#" isExternal></Link>
        </HStack>

        <Box borderWidth={1} borderRadius="md" p={4}>
          <Text fontWeight="bold" mb={2}>
            Minimum Stake Requirement
          </Text>
          <Text color="red.500">
            To participate Voting, you need at least 1000 BSM.
          </Text>
        </Box>

        <Flex>
          <Box flex={1} borderWidth={1} borderRadius="md" p={4} mr={4}>
            <Text fontWeight="bold" mb={4}>
              Manage
            </Text>
            <Text color="gray.600" mb={4}>
              Manage your position in the BSM Staking contract.
            </Text>
            <HStack mb={4}>
              <Button
                flex={1}
                onClick={handleStake}
                isDisabled={!stakeAmount || parseFloat(stakeAmount) < 1}
              >
                Stake
              </Button>
              <Button flex={1} variant="outline" onClick={handleUnstake}>
                Unstake
              </Button>
            </HStack>
            <Box borderWidth={1} borderRadius="md" p={4}>
              <Text mb={2}>Stake</Text>
              <Text color="blue.500" mb={2}>
                1 BSM ($1.00)
              </Text>
              <HStack mb={2}>
                <Input
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  type="number"
                  min="1"
                />
                <Text>BSM</Text>
              </HStack>
            </Box>
          </Box>
          <Box flex={1} borderWidth={1} borderRadius="md" p={4}>
            <Text fontWeight="bold" mb={4}>
              Your Balance
            </Text>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text>Available</Text>
                <HStack>
                  <Image src="/images/logo.png" boxSize="20px" alt="BSM icon" />
                  <Text>BSM</Text>
                  <Spacer />
                  <Text>
                    {balance.BSM} ${balance.BSM.toFixed(2)}
                  </Text>
                </HStack>
              </Box>
              <Box>
                <Text>Staked</Text>
                <HStack>
                  <Image
                    src="/images/logo2.png"
                    boxSize="20px"
                    alt="BSM icon"
                  />
                  <Text>BSM</Text>
                  <Spacer />
                  <Text>
                    {stakedAmount.toFixed(2)} ${stakedAmount.toFixed(2)}
                  </Text>
                </HStack>
              </Box>
              <Box>
                <Text>Rewards</Text>
                <HStack>
                  <Image
                    src="/images/logo.png"
                    boxSize="20px"
                    alt="Reward icon"
                  />
                  <Text>BSM</Text>
                  <Spacer />
                  <Text>
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
