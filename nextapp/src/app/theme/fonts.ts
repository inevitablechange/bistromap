// app/fonts.ts
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakartasans",
});

export const fonts = {
  plusJakartaSans,
};
