// app > mypage > page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Grid,
  Badge,
} from "@chakra-ui/react";
import { BigNumberish, Contract, ethers } from "ethers";
import { useAccount } from "@/context/AccountContext";
import { IoRestaurantOutline } from "react-icons/io5";
import USDT_ABI from "../../abi/UsdtToken.json";
import BSM_ABI from "../../abi/BsmToken.json";

import PAIR_ABI from "../../abi/UniswapPair.json";
import config from "@/constants/config";

interface ReviewData {
  id: number;
  title: string;
  restaurant: string;
  content: string;
  votes: number;
  published_at: string;
}

const dummyReviews: ReviewData[] = [
  {
    id: 1,
    title: "Amazing Dining Experience at Tokyo Sushi",
    restaurant: "Tokyo Sushi",
    content: "The sushi was fresh and the service was amazing!",
    votes: 120,
    published_at: "2024-03-15T12:00:00Z",
  },
  {
    id: 2,
    title: "A Delightful Evening at French Bistro",
    restaurant: "French Bistro",
    content: "The atmosphere was perfect for a romantic dinner.",
    votes: 98,
    published_at: "2024-04-10T19:00:00Z",
  },
  // 더미 리뷰 추가
];

const MyPage: React.FC = () => {
  const { signer } = useAccount();

  const [bsmContract, setBsmContract] = useState<Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<Contract | null>(null);

  const [pairContract, setPairContract] = useState<Contract | null>(null);
  const [bsmBalance, setBsmBalance] = useState<BigNumberish>(BigInt(0));
  const [usdtBalance, setUsdtBalance] = useState<BigNumberish>(BigInt(0));
  const [lpBalance, setLpBalance] = useState<BigNumberish>(BigInt(0));

  useEffect(() => {
    if (!signer) return;

    const bsmCtr = new Contract(config.BSM_ADDRESS, BSM_ABI, signer);
    const usdtCtr = new Contract(config.USDT_ADDRESS, USDT_ABI, signer);
    const pairCtr = new Contract(config.UNISWAP_V2_PAIR, PAIR_ABI, signer);

    setBsmContract(bsmCtr);
    setUsdtContract(usdtCtr);
    setPairContract(pairCtr);
  }, [signer]);

  useEffect(() => {
    if (!signer || !bsmContract || !usdtContract || !pairContract) return;

    const getBalances = async () => {
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

    getBalances();
  }, [signer, bsmContract, usdtContract]);

  return (
    <Container maxW="1200px" py={10}>
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          My Token Balance
        </Heading>
        <Box borderWidth={1} p={4} rounded="lg" bg="yellow.100">
          <Text fontSize="xl" fontWeight="bold">
            BSM Token Balance: {bsmBalance} BSM
          </Text>
          <Text fontSize="xl" fontWeight="bold">
            USDT Balance: {usdtBalance} USDT
          </Text>
          <Text fontSize="xl" fontWeight="bold">
            lpBSM Token Balance: {lpBalance} lpBSM
          </Text>
        </Box>
      </Box>

      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          My Reviews
        </Heading>
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <Box
            borderWidth={1}
            p={4}
            rounded="lg"
            h="300px"
            overflow="hidden"
            bg="yellow.50"
          >
            <Heading size="md" mb={2}>
              Review Title
            </Heading>
            <Flex align="center" mb={2}>
              <IoRestaurantOutline /> <Text ml={2}>Review Restaurant</Text>
            </Flex>
            <Text fontSize="sm" mb={2}>
              Review Content{" "}
            </Text>
            <Badge colorScheme="green" fontSize="md">
              Review Votes{" "}
            </Badge>
          </Box>
        </Grid>
      </Box>

      <Flex justify="center">
        <Button bg="yellow.400" color="black" size="lg">
          Write a New Review
        </Button>
      </Flex>
    </Container>
  );
};

export default MyPage;
