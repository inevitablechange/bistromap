"use client";

import React from "react";
import { Box, Container, Grid, Heading, Text, Flex } from "@chakra-ui/react";
import RestaurantCard from "../../components/RestaurantCard";
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

// 더미 데이터 생성
const dummyData: CardData[] = [
  {
    id: 1,
    serial_number: "dummy1",
    title: "ViseVersa, The Hyatt Regency Lisbon",
    restaurant: "ViseVersa",
    content:
      "It would be easy to say that the past decade or so has been kind to Lisbon – it’s subtly undergone the kind of glow-up certain other smaller European capitals keep putting on the backburner… and it’s been driven organically by tourism raised high on the shoulders of social media’s more gastronomy-oriented corners. ",
    image: "/images/dummy1.png",
    votes: 150,
    published_at: "2024-03-15T12:00:00Z",
  },
  {
    id: 2,
    serial_number: "dummy2",
    title: "Marbella’s Gastronomic Sweetspots, Old and New",
    restaurant: "Gastronomic Sweetspots",
    content:
      "Nestled on the sun-drenched shores of the Costa del Sol, Marbella is an irresistible blend of natural beauty, cultural richness, and unparalleled luxury. Renowned for its breath-taking beaches and glamorous lifestyle, it is also a culinary haven that tantalises even the most discerning visitor. ",
    image: "/images/dummy2.jpg",
    votes: 137,
    published_at: "2024-03-17T14:23:12Z",
  },
  {
    id: 3,
    serial_number: "dummy3",
    title: "Slolw London",
    restaurant: "Chino Latino",
    content:
      "For me, London tends to be a swift one-day affair for a day on set, back-to-back meetings or events across the city. However, last week my visit was a little different, I was to stay at The Gantry, a Stratford hotel, with dinner at Chino Latino, just south of the river. ",
    image: "/images/dummy3.jpg",
    votes: 169,
    published_at: "2024-03-02T23:17:24Z",
  },
  {
    id: 4,
    serial_number: "dummy4",
    title: "A Singular Expression of Gastronomic Finesse",
    restaurant: "Terre by Vincent Crepel",
    content:
      "The lighting is dramatically, moodily low. We’re guided through an opulent Georgian-inflected drawing room – all wing-backed chairs and warm mahogany – into a corridor stacked high on either side with an alchemist’s array of ferments, pickles and preserved treasures from both garden and seashore. We step onwards, into a sleek yet cosy dining room consisting of a mere three tables.",
    image: "/images/dummy4.jpeg",
    votes: 211,
    published_at: "2024-04-05T17:21:18Z",
  },
  {
    id: 5,
    serial_number: "dummy5",
    title: "Sexy Fish",
    restaurant: "Sexy Fish",
    content:
      "It didn’t. It rattled around the aerialist’s neck during the more dramatic scenes, in a way that would make a national space agency ashamed. Hackney, we have a problem. My only moment of respite was lunch, which was the hastiest of affairs from a fast food outlet that shall remain nameless. Spicy chicken – draw your own conclusions.",
    image: "/images/dummy5.jpeg",
    votes: 198,
    published_at: "2024-04-08T15:19:28Z",
  },
  {
    id: 6,
    serial_number: "dummy6",
    title: "Angelina",
    restaurant: "Angelina",
    content:
      "It was last November when I first received word that a new Japanese-Italian restaurant was opening in Dalston, East London. The invitation — for a preview dinner party — contained a certain ‘f’ word. No, not ‘food’, nor the other ‘f’ word so often used when eating out (example usage: ‘How — much?’). The word is — of course — ‘fusion’. ",
    image: "/images/dummy6.jpg",
    votes: 188,
    published_at: "2024-04-13T15:47:21Z",
  },
  // ... 더 많은 더미 데이터 추가 (총 12개 정도)
];

const SelectionPage: React.FC = () => {
  const router = useRouter();

  const handleCardClick = (serialNumber: string) => {
    router.push(`/posts/${serialNumber}`);
  };

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
          {dummyData.map((card) => (
            <RestaurantCard
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card.serial_number)}
            />
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default SelectionPage;
