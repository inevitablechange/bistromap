"use client";

import RestaurantCard from "@/components/RestaurantCard";
import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex bgColor="green.100" minWidth={"1440px"} justifyContent={"center"}>
      <RestaurantCard />
      <RestaurantCard />
      <RestaurantCard />
    </Flex>
  );
}
