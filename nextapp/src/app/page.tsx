"use client";

import RestaurantCard from "@/components/RestaurantCard";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation"; // 현재 경로를 확인하는 훅
import BannerSlider from "../components/BannerSlider"; // 배너 슬라이더 컴포넌트
import "@/app/styles/globals.css"; // 전역 스타일
import OwnerCheckModal from "@/components/OwnerCheckModal";
import { useState } from "react";

export default function Home() {
  const pathname = usePathname(); // 현재 경로를 가져옵니다
  const showBanner = pathname !== "/mint";
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  return (
    <Box w={"100%"}>
      <Box
        h={500}
        bgColor={"yellow.200"}
        pt={"100px"}
        textAlign={"center"}
        color={"gray.900"}
      >
        <Box lineHeight={"32px"} fontSize={"x-large"} fontWeight={"semibold"}>
          A Web 3.0 Review Platform for the people who want better food
          experience
        </Box>
        <Box
          color="gray.900"
          fontWeight={700}
          fontSize={"60px"}
          lineHeight={"76px"}
          mt={4}
        >
          PUBLISH YOUR THOUGHTS AND SHARE
        </Box>
        <Text fontSize={"large"} mt={8} mb={6}>
          Welcome to Bistromap, where we take your cravings to a whole new
          level! <br />
          Our mouthwatering burgers are made from 100% beef and are served on
          freshly baked buns.{" "}
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
      <BannerSlider setIsModalOpen={setIsModalOpen} />
      <OwnerCheckModal isOpen={isModalOpen} />

      <Flex minWidth={"1440px"} justifyContent={"center"}>
        <RestaurantCard />
        <RestaurantCard />
        <RestaurantCard />
      </Flex>
    </Box>
  );
}
