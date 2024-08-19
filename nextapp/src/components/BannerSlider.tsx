"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import Link from "next/link";
import { PinataSDK, PinListItem } from "pinata";

import styles from "@/app/styles/BannerSlider.module.css";

const BannerSlider: React.FC = () => {
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

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Slider {...settings} className={styles.slider}>
      {nftBanners.map((b) => {
        return (
          <div key={b.ipfs_pin_hash}>
            <Link
              href={"https://" + b.metadata.keyvalues?.link}
              target="_blank"
              passHref={true}
            >
              <Image
                src={`https://pink-rapid-clownfish-409.mypinata.cloud/ipfs/${b.ipfs_pin_hash}`}
                alt={b.metadata.keyvalues?.link}
                width={900}
                height={400}
              />
            </Link>
          </div>
        );
      })}
      <Link href={"/mint"}>
        <Image
          src={"/images/Ads.jpeg"}
          alt={"Available Ads"}
          width={900}
          height={400}
        />
      </Link>
    </Slider>
  );
};

export default BannerSlider;
