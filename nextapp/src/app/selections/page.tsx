"use client";

import React, { useEffect, useState } from "react";
import { Box, Container, Grid, Heading, Text, Flex } from "@chakra-ui/react";
import RestaurantCard from "../../components/RestaurantCard";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

// 카드 데이터 타입 정의
interface CardData {
  id: number;
  serial_number: string;
  title: string;
  restaurant: string;
  content: string;
  image: string;
  votes: number;
  published_at: string;
}

const SelectionPage: React.FC = () => {
  const [cards, setCards] = useState<Publication>([]);
  const router = useRouter();
  useEffect(() => {
    const getReviews = async () => {
      const { data: reviews, error } = await supabase
        .from("publications")
        .select("")
        .eq("elected", true)
        .order("published_at", { ascending: false });
      if (error) {
        return [];
      }
      setCards(reviews);
      console.log({ reviews });
    };
    getReviews();
  }, []);

  return (
    <Box>
      <Box
        bgImage="url('/images/bgimage.png')"
        bgPosition="center"
        bgSize="cover"
        bgRepeat="no-repeat"
        width="100%"
        height="300px"
        color="white"
        p={8}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          height="100%"
          textAlign="center"
        >
          <Heading as="h1" size="4xl" mb={4}>
            Selections
          </Heading>
        </Flex>
      </Box>

      <Flex
        direction="column"
        align="center"
        justify="center"
        textAlign="center"
      >
        <Heading as="h2" size="xl" mt={10}>
          Selected on March, 2024
        </Heading>
      </Flex>

      <Container maxW="1440px" mt={10}>
        <Grid templateColumns="repeat(3, 1fr)" gap={8}>
          {cards.map((card: Publication) => (
            <RestaurantCard
              key={card.id}
              card={card}
              onClick={() => router.push(`/selections/${card.serial_number}`)}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default SelectionPage;
