import React from "react";
import { Providers } from "./providers"; // Chakra UI를 위한 Providers
import { Flex } from "@chakra-ui/react"; // Chakra UI의 Flex 컨테이너
import Header from "../components/Header"; // 헤더 컴포넌트
import Footer from "@/components/Footer"; // 푸터 컴포넌트
import { usePathname } from "next/navigation";
import { AccountProvider } from "@/context/AccountContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "BistroMap",
  description: "Share your experience and get rewarded",
  icons: {
    icon: "/favicon.ico",
  },
};
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 민트 페이지에서는 배너를 숨기기
  return (
    <html lang="en">
      <body>
        <Providers>
          <AccountProvider>
            {/* Chakra UI의 테마와 설정을 제공 */}
            <Flex minH="100vh" flexDir="column" alignItems="center">
              <Header /> {/* Header를 레이아웃 상단에 추가 */}
              {/* 경로에 따라 배너를 조건부로 렌더링 */}
              {children} {/* 자식 컴포넌트 */}
              {/* {pathname == "/write" ? null : <Footer />} */}
            </Flex>
          </AccountProvider>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
