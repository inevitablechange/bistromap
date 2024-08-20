"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import { PinataSDK, PinListItem } from "pinata";
import { A11y, Navigation, Pagination, Scrollbar } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Box, Flex } from "@chakra-ui/react";

interface BannerSliderProps {
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

const BannerSlider: React.FC<BannerSliderProps> = ({ setIsModalOpen }) => {
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT || "",
    pinataGateway: "pink-rapid-clownfish-409.mypinata.cloud",
  });

  const [nftBanners, setNftBanners] = useState<PinListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTBanners();
  }, []);

  const fetchNFTBanners = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const data = await pinata.listFiles().pinStart("2024-07-16T11:41:19Z");
        setNftBanners(data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching NFT banners:", error);
        setLoading(false);
      }
    }
  };

  const handleClick = () => {
    setIsModalOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Swiper
      modules={[Pagination, Navigation, Scrollbar, A11y]}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
      onSwiper={(swiper) => console.log(swiper)}
      onSlideChange={() => console.log("slide change")}
    >
      {nftBanners.map((banner) => (
        <SwiperSlide key={banner.ipfs_pin_hash}>
          <Flex>
            <Link href={banner.metadata.keyvalues?.link}>
              <img
                src={`https://pink-rapid-clownfish-409.mypinata.cloud/ipfs/${banner.ipfs_pin_hash}`}
                alt={banner.metadata.keyvalues?.link}
                width={"100%"}
                height={400}
              />
            </Link>
          </Flex>
        </SwiperSlide>
      ))}
      <SwiperSlide>
        <Box
          style={{
            display: "block",
            position: "relative",
            width: "100%",
            height: "400px",
          }}
        >
          <img
            src={"/assets/bg-banner.png"}
            alt={"Available Ads"}
            width={"100%"}
            height={"auto"}
            style={{ position: "absolute" }}
          />
          <Box
            position="absolute"
            left={"50%"}
            transform={"translateX(-50%)"}
            mt="140px"
            fontSize={"lg"}
            fontWeight={700}
            textColor={"white"}
            borderRadius={6}
            padding={6}
            bgColor={"#1D211A40"}
          >
            Ads Banner Available Here
            <br />
            Click &nbsp;
            <span
              style={{ cursor: "pointer", color: "#F3CD00", fontSize: 24 }}
              onClick={handleClick}
            >
              <i>here</i>
            </span>
            &nbsp; and make your business accessible to users
          </Box>
        </Box>
      </SwiperSlide>
    </Swiper>
  );
};

export default BannerSlider;
