import { Flex, Grid } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import RestaurantCard from "./RestaurantCard";

const RestaurantCardList = () => {
  const [cards, setCards] = useState<Publication>([]);
  useEffect(() => {
    const getReviews = async () => {
      const { data: reviews, error } = await supabase
        .from("publications")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) {
        return [];
      }
      setCards(reviews);
    };

    getReviews();
  }, []);
  if (cards.length == 0) return null;
  return (
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
        <RestaurantCard key={card.id} card={card} />
      ))}
      <RestaurantCard card={cards[1]} />
    </Grid>
  );
};

export default RestaurantCardList;
