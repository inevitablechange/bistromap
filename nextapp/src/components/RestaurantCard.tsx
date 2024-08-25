import { Badge, Box, Flex, Heading, Image, Text } from "@chakra-ui/react";
import { IoRestaurantOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";

// RestaurantCard 컴포넌트의 Props 타입 정의
interface RestaurantCardProps {
  card: {
    serial_number: string;
    title: string;
    restaurant: string;
    content: string;
    image?: string;
    votes: number;
    published_at: string;
  };
  onClick?: () => void; // 선택적 onClick 핸들러 추가
}

const RestaurantCard = ({ card, onClick }: RestaurantCardProps) => {
  const router = useRouter();

  // HTML 콘텐츠에서 첫 번째 이미지를 제거
  const cleanMessage = card.content.replace(/<img\b[^>]*>/gi, "");

  // HTML 콘텐츠에서 첫 번째 이미지의 src를 추출
  const firstImgSrcMatch = card.content.match(/<img[^>]+src="([^">]+)"/i);
  const firstImgSrc = firstImgSrcMatch ? firstImgSrcMatch[1] : card.image;

  // 날짜를 한국식으로 포맷팅하는 함수
  const getFormattedDate = (d: string) =>
    Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));

  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      h={"500px"}
      cursor="pointer"
      onClick={() => {
        if (onClick) {
          onClick(); // 외부에서 전달된 onClick 핸들러가 있으면 호출
        } else {
          router.push(`/posts/${card.serial_number}`); // 기본 페이지 이동
        }
      }}
    >
      <Box>
        <Image
          w={"full"}
          height={"300px"}
          rounded="lg"
          src={firstImgSrc || "/images/default.png"}
          alt={card.restaurant}
          objectFit="cover"
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

          <Flex mt={2} gap={3} alignItems={"center"}>
            <IoRestaurantOutline /> {card.restaurant},{" "}
            <Text fontSize={"small"} alignSelf={"end"}>
              Published at {getFormattedDate(card.published_at)}
            </Text>
          </Flex>
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
