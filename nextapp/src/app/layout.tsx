import { Providers } from "./providers";
import { Flex } from "@chakra-ui/react";
import Header from "../components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Flex minH="100vh" flexDir={"column"} alignItems="center">
            <Header />
            {children}
            <Footer />
          </Flex>
        </Providers>
      </body>
    </html>
  );
}
