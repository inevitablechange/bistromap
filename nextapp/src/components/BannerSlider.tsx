"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import Link from "next/link";
import styles from "../app/styles/BannerSlider.module.css";
import { ethers } from "ethers";
import BannerNFT from "../../../solidity/artifacts/contracts/BannerNFT.sol/BannerNFT.json";

const bannerNFTAddress = "0x1ce31b93380D1cD249312b7b64e7BD9A4A218FeF";

const BannerSlider: React.FC = () => {
  const [nftBanners, setNftBanners] = useState<
    Array<{ image: string; link: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTBanners();
  }, []);

  const fetchNFTBanners = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        bannerNFTAddress,
        BannerNFT.abi,
        provider
      );

      try {
        const totalSupply = await contract.totalSupply();
        const banners = [];

        for (
          let i = totalSupply.toNumber();
          i > totalSupply.toNumber() - 2 && i > 0;
          i--
        ) {
          // 최근 2개 가져오기
          const tokenURI = await contract.tokenURI(i);
          const response = await fetch(tokenURI);
          const metadata = await response.json();
          banners.push({ image: metadata.image, link: metadata.description });
        }

        setNftBanners(banners);
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

  const adsBanner = {
    image: "/images/Ads.jpeg",
    link: "/mint",
  };

  const allBanners = [...nftBanners, adsBanner];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Slider {...settings} className={styles.slider}>
      {allBanners.map((banner, index) => (
        <div key={index}>
          <Link href={banner.link}>
            <Image
              src={banner.image}
              alt={`Banner ${index + 1}`}
              width={900}
              height={400}
              layout="responsive"
            />
          </Link>
        </div>
      ))}
    </Slider>
  );
};

export default BannerSlider;
