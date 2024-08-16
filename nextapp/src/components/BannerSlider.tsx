// components/BannerSlider.tsx
"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import React from "react";
import Slider from "react-slick";
import Banner from "./Banner";
import styles from "../app/styles/BannerSlider.module.css";

const banners = [
  { image: "/images/banner1.jpg" }, // 민트 페이지 링크
  { image: "/images/banner2.jpg" }, // 민트 페이지 링크
  { image: "/images/Ads.jpeg", link: "/mint" }, // 민트 페이지 링크
];

const BannerSlider: React.FC = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <Slider {...settings} className={styles.slider}>
      {banners.map((banner, index) => (
        <Banner key={index} image={banner.image} link={banner.link} />
      ))}
    </Slider>
  );
};

export default BannerSlider;
