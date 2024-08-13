import "./globals.css";
import { Providers } from "./providers";
import Header from "../components/header"; // 경로를 설정하세요.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
