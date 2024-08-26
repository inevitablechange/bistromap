// app > mypage > page.tsx
"use client";

import { FC, useEffect, useState } from "react";
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

import USDT_ABI from "../../abi/UsdtToken.json";
import BSM_ABI from "../../abi/BsmToken.json";
import PAIR_ABI from "../../abi/UniswapPair.json";
import config from "@/constants/config";
import RestaurantCard from "@/components/RestaurantCard";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const MyPage: FC = () => {
  const router = useRouter();
  const { signer } = useAccount();

  const [bsmContract, setBsmContract] = useState<Contract | null>(null);
  const [usdtContract, setUsdtContract] = useState<Contract | null>(null);

  const [pairContract, setPairContract] = useState<Contract | null>(null);
  const [bsmBalance, setBsmBalance] = useState<BigNumberish>(BigInt(0));
  const [usdtBalance, setUsdtBalance] = useState<BigNumberish>(BigInt(0));
  const [lpBalance, setLpBalance] = useState<BigNumberish>(BigInt(0));
  const [cards, setCards] = useState<Publication>([]);

  useEffect(() => {
    const getReviews = async () => {
      const { data: reviews, error } = await supabase
        .from("publications")
        .select("*")
        .eq("user_address", signer?.address)
        .order("published_at", { ascending: false });
      if (error) {
        return [];
      }
      setCards(reviews);
      console.log({ reviews });
    };
    getReviews();
  }, [signer]);

  useEffect(() => {
    if (!signer) return;

    const bsmCtr = new Contract(config.BSM_ADDRESS, BSM_ABI, signer);
    const usdtCtr = new Contract(config.USDT_ADDRESS, USDT_ABI, signer);
    const pairCtr = new Contract(config.UNISWAP_V2_PAIR, PAIR_ABI, signer);

    setBsmContract(bsmCtr);
    setUsdtContract(usdtCtr);
    setPairContract(pairCtr);

    console.log(bsmContract, usdtContract, pairContract);
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
            BSM Token Balance:{" "}
            {Number(ethers.formatUnits(bsmBalance, 18)).toFixed(3)} BSM
          </Text>
          <Text fontSize="xl" fontWeight="bold">
            USDT Balance:{" "}
            {Number(ethers.formatUnits(usdtBalance, 18)).toFixed(3)} USDT
          </Text>
          <Text fontSize="xl" fontWeight="bold">
            lpBSM Token Balance:{" "}
            {Number(ethers.formatUnits(lpBalance, 18)).toFixed(3)} lpBSM
          </Text>
        </Box>
      </Box>

      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          My Reviews
        </Heading>
        <Grid
          mx={"auto"}
          mt={10}
          mb={20}
          gap={[4, 6, 8]}
          templateColumns="repeat(3, 1fr)"
          maxWidth={"1280px"}
          justifyContent={"around"}
        >
          {cards.map((card: Publication) => (
            <RestaurantCard
              onClick={() => {
                router.push(`/posts/${card.serial_number}`);
              }}
              key={card.id}
              card={card}
            />
          ))}
        </Grid>
      </Box>

      <Flex justify="center">
        <Button href={"/write"} as="a" bg="yellow.400" color="black" size="lg">
          Write a New Review
        </Button>
      </Flex>
    </Container>
  );
};

export default MyPage;
