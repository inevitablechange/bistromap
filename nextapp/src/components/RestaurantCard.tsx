import { StarIcon } from "@chakra-ui/icons";
import { Badge, Box, Flex, Heading, Image, Text } from "@chakra-ui/react";
import { IoRestaurantOutline } from "react-icons/io5";
import { TfiHeart } from "react-icons/tfi";

const RestaurantCard = ({ card }: Publication) => {
  const cleanMessage = card.content.replace(/<img\b[^>]*>/gi, "");
  const firstImgSrcMatch = card.content.match(/<img[^>]+src="([^">]+)"/i);

  // Extract the src value (if found)
  const firstImgSrc = firstImgSrcMatch ? firstImgSrcMatch[1] : null;
  const getFormattedDate = (d: string) =>
    Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  return (
    <Box borderRadius="lg" overflow="hidden" h={"500px"}>
      <Box>
        <Image
          w={"full"}
          height={"300"}
          rounded="lg"
          src={firstImgSrc}
          alt={card.restaurant}
        />
      </Box>

      <Box mt={4}>
        <Box display="flex" alignItems="baseline"></Box>
        <Box float={"right"} fontWeight={"bold"}>
          <Badge
            py={1}
            px={2}
            bgColor={"pink.500"}
            color="white"
            rounded="full"
            fontWeight={"bold"}
          >
            {card.votes ? card.votes : "0"} Voted
          </Badge>
        </Box>
        <Box mt="1" fontWeight="semibold">
          <Heading as="h4" fontSize={"lg"} w={"75%"}>
            {card.title}
          </Heading>

          <Text>
            <Flex mt={2} gap={3} alignItems={"center"}>
              <IoRestaurantOutline /> {card.restaurant},{" "}
              <Text fontSize={"small"} alignSelf={"end"}>
                Published at {getFormattedDate(card.published_at)}
              </Text>
            </Flex>
          </Text>
        </Box>

        <Box
          mt={2}
          fontSize={"sm"}
          height={"150px"}
          color="gray.600"
          lineHeight={"19px"}
          overflow={"hidden"}
          dangerouslySetInnerHTML={{ __html: cleanMessage }}
        ></Box>
      </Box>
    </Box>
  );
};

export default RestaurantCard;
