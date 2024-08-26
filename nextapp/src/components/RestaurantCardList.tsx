import { Grid } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import RestaurantCard from "./RestaurantCard";
import { useRouter } from "next/navigation";
const RestaurantCardList = () => {
  const router = useRouter();
  const [cards, setCards] = useState<Publication>([]);
  useEffect(() => {
    const getReviews = async () => {
      const { data: reviews, error } = await supabase
        .from("publications")
        .select("")
        .order("published_at", { ascending: false });
      if (error) {
        return [];
      }
      setCards(reviews);
      console.log({ reviews });
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
        <RestaurantCard
          key={card.id}
          card={card}
          onClick={() => {
            router.push(`/posts/${card.serial_number}`);
          }}
        />
      ))}
    </Grid>
  );
};
export default RestaurantCardList;
