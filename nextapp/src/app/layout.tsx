// app/layout.tsx

"use client"; // 클라이언트 컴포넌트로 명시

import React from "react";
import { Providers } from "./providers"; // Chakra UI를 위한 Providers
import { Flex } from "@chakra-ui/react"; // Chakra UI의 Flex 컨테이너
import { usePathname } from "next/navigation"; // 현재 경로를 확인하는 훅
import Header from "../components/Header"; // 헤더 컴포넌트
import Footer from "@/components/Footer"; // 푸터 컴포넌트
import BannerSlider from "../components/BannerSlider"; // 배너 슬라이더 컴포넌트
import "../app/styles/globals.css"; // 전역 스타일

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname(); // 현재 경로를 가져옵니다

  // 민트 페이지에서는 배너를 숨기기
  const showBanner = pathname !== "/mint";

  return (
    <html lang="en">
      <body>
        <Providers>
          {" "}
          {/* Chakra UI의 테마와 설정을 제공 */}
          <Flex minH="100vh" flexDir="column" alignItems="center">
            <Header /> {/* Header를 레이아웃 상단에 추가 */}
            {showBanner && <BannerSlider />}{" "}
            {/* 경로에 따라 배너를 조건부로 렌더링 */}
            <main>
              {children} {/* 자식 컴포넌트 */}
            </main>
            <Footer /> {/* Footer를 레이아웃 하단에 추가 */}
          </Flex>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
