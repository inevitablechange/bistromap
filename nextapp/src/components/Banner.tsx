// components/Banner.tsx
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../app/styles/BannerSlider.module.css";

interface BannerProps {
  image: string;
  link?: string; // link를 선택적으로 만듭니다
}

const Banner: React.FC<BannerProps> = ({ image, link }) => {
  const router = useRouter();

  const handleClick = () => {
    if (link) {
      router.push(link); // 링크가 있는 경우에만 이동
    }
  };

  return (
    <div className={styles.bannerContainer} onClick={handleClick}>
      <Image
        src={image}
        alt="Banner"
        layout="responsive"
        width={900}
        height={400}
        className={styles.bannerImage} // 스타일 추가
      />
    </div>
  );
};

export default Banner;
