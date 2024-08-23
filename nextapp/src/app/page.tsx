"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation"; // 현재 경로를 확인하는 훅
import BannerSlider from "../components/BannerSlider"; // 배너 슬라이더 컴포넌트
import "@/styles/globals.css"; // 전역 스타일
import OwnerCheckModal from "@/components/OwnerCheckModal";
import { useState } from "react";
import RestaurantCardList from "@/components/RestaurantCardList";

export default function Home() {
  const pathname = usePathname(); // 현재 경로를 가져옵니다
  const showBanner = pathname !== "/mint";
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <Box w={"100%"}>
      <Box
        mb={4}
        h={400}
        bgColor={"yellow.200"}
        pt={"100px"}
        textAlign={"center"}
        color={"gray.900"}
      >
        <Box lineHeight={"24px"} fontSize={"large"} fontWeight={"semibold"}>
          A Web 3.0 Review Platform for the people who want better food
          experience
        </Box>
        <Box
          color="gray.900"
          fontWeight={700}
          fontSize={"48px"}
          lineHeight={"56px"}
          mt={2}
        >
          PUBLISH YOUR THOUGHTS AND SHARE
        </Box>
        <Text fontSize={"md"} mt={6} mb={4}>
          Welcome to Bistromap, where we take your cravings to a whole new
          level! <br />
          Our mouthwatering burgers are made from 100% beef and are served on
          freshly baked buns.
        </Text>
        <Flex gap={6} justifyContent={"center"}>
          <Button
            bg={"primary"}
            borderRadius={50}
            fontWeight={300}
            color={"cream"}
            border="1px solid"
            borderColor={"indigoNight"}
          >
            Review Now
          </Button>
          <Button
            bg="cream"
            borderRadius={50}
            fontWeight={300}
            border="1px solid"
            borderColor="indigoNight"
          >
            Explore
          </Button>
        </Flex>
      </Box>
      <section>
        <BannerSlider setIsModalOpen={setIsModalOpen} />
      </section>
      <section style={{ marginTop: 40 }}>
        <RestaurantCardList />
      </section>
      <Box h="200px" bgGradient="linear(to-r, yellow.200, pink.500)"></Box>
      <OwnerCheckModal isOpen={isModalOpen} />
    </Box>
  );
}
